var common = {};

common.display = 'lg';

ON('ready', function() {

	$(document).on('input', 'select', function() {
		preview_download($(this).val());
	});

	$('select').trigger('input');
});

SETTER(true, 'shortcuts', 'register', 'F5', preview_refresh, true);
SETTER(true, 'shortcuts', 'register', 'cmd+r', preview_refresh, true);
SETTER(true, 'shortcuts', 'register', 'shift+cmd+R', preview_refresh, true);

function preview_refresh() {
	preview_download(common.name);
}

function preview_settings() {
	SETTER('multioptions', 'remap2', function(option) {
		if (common.detail.data.editor) {
			common.detail.exports = {};
			(new Function('option', 'exports', common.detail.data.editor))(option, common.detail.exports);
		}
	});
	SET('common.form', 'settings');
}

function settings_apply(com) {
	common.detail.exports.configure(common.detail.options, common.detail.el);
	com.hide();
}

WATCH('common.editormode', function() {
	common.name && preview_refresh();
});

WATCH('common.display', function(path, value) {
	$('#frm').rclass().aclass(value);
}, true);

function preview_download(name) {

	common.name = name;

	AJAX('GET /', { name: name, type: 1 }, function(response) {
		AJAX('GET /', { name: name, type: 2 }, function(layout) {
			var data = compile(response);

			AJAX('POST /api/css/', { css: data.css }, function(css) {

				var dep = '<link href="https://cdn.totaljs.com/spa.min.css" rel="stylesheet" type="text/css" /><script src="https://cdn.totaljs.com/spa.min.js"></script><style>.wmargin{margin-bottom:20px}.wpadding{padding:20px 0}</style>';

				if (common.editormode)
					dep += '<style>.CMS_edit,.CMS_widgets{cursor:crosshair}.CMS_selected_template{background-color:rgba(225,29,0,.05)!important;border-color:#D42C1A!important}.CMS_operation{opacity:.5}.CMS_widgets{border-top:6px solid #E0E0E0;padding-top:5px}.CMS_hidden{display:block!important}.CMS_panel_hidden{display:none!important}.CMS_preview .totaljs{background-color:#F0F0F0;background-image:repeating-linear-gradient(45deg,#E0E0E0,#E0E0E0 10px,#F0F0F0 10px,#F0F0F0 20px);padding:30px 0;font-weight:700;color:#000;margin:1px;text-align:center;font-size:11px;text-transform:uppercase}.CMS_preview .jcomponent span{display:block!important}iframe.CMS_edit{padding:5px;border:15px solid red}</style>';

				var html = ('<!DOCTYPE html>\n<html>\n<head>\n\t<title>{0}</title>\n\t<meta charset="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />\n\t<meta http-equiv="X-UA-Compatible" content="IE=10" />\n\t<meta name="robots" content="all,follow" />{1}\n\t<style>\n\t\t{2}\n\t</style>\n</head>\n<body' + (common.editormode ? ' class="CMS_preview"' : '') + '>\n\n\t<scr' + 'ipt>\n\t\t{3}\n\t</scr' + 'ipt>\n\n\t{4}\n</body>\n</html>').format('Widget preview', dep, css, data.js, layout.replace('<div id="CMS">', '<div id="CMS">' + data.html));

				common.detail = {};
				common.detail.data = data;
				common.detail.layout = layout;
				common.detail.html = html;
				common.detail.options = {};

				var frm = document.getElementById('frm');
				frm.contentWindow.document.open();
				frm.contentWindow.document.write(html);
				frm.contentWindow.document.close();

				common.detail.frm = frm;

				setTimeout(function() {
					common.detail.el = $(frm).contents().find('#CMS');
					$(common.detail.frm).contents().on('click', function() {
						$(window).focus();
						$(document).focus();
					});
				}, 500);

				UPDATE('common.detail');
			});
		});
	});
}

function compile(html) {

	var beg = -1;
	var end = -1;

	var body_script = '';
	var body_editor = '';
	var body_style = '';
	var body_html = '';
	var body_total = '';
	var raw = html;

	while (true) {

		beg = html.indexOf('<script', end);
		if (beg === -1)
			break;

		end = html.indexOf('</script>', beg);
		if (end === -1)
			break;

		var body = html.substring(beg, end);
		var beg = body.indexOf('>') + 1;
		var type = body.substring(0, beg);

		body = body.substring(beg);
		raw = raw.replace(type + body + '</script>', '');

		body = body.trim();

		if (type.indexOf('html') !== -1 || type.indexOf('plain') !== -1)
			body_html = body;
		else if (type.indexOf('total') !== -1 || type.indexOf('totaljs') !== -1)
			body_total = body;
		else if (type.indexOf('editor') !== -1)
			body_editor = body;
		else
			body_script = body;

		end += 9;
	}

	beg = raw.indexOf('<style');
	if (beg !== -1) {
		end = raw.indexOf('</style>');
		var tmp = raw.substring(raw.indexOf('>', beg) + 1, end);
		raw = raw.replace(raw.substring(beg, end + 8), '');
		body_style = tmp.trim();
	}

	if (!body_html) {
		raw = raw.trim();
		raw && (body_html = raw);
	}

	var obj = {};

	obj.js = body_script;
	obj.editor = body_editor;
	obj.css = body_style;
	obj.html = body_html;

	if (body_total)
		obj.total = body_total;

	return obj;
}

COMPONENT('multioptions', function(self) {

	var Tinput = Tangular.compile('<input class="ui-moi-save ui-moi-value-inputtext" data-name="{{ name }}" type="text" value="{{ value }}"{{ if def }} placeholder="{{ def }}"{{ fi }}{{ if max }} maxlength="{{ max }}"{{ fi }} data-type="text" />');
	var Tselect = Tangular.compile('<div class="ui-moi-value-select"><i class="fa fa-chevron-down"></i><select data-name="{{ name }}" class="ui-moi-save ui-multioptions-select">{{ foreach m in values }}<option value="{{ $index }}"{{ if value === m.value }} selected="selected"{{ fi }}>{{ m.text }}</option>{{ end }}</select></div>');
	var Tnumber = Tangular.compile('<div class="ui-moi-value-inputnumber-buttons"><span class="multioptions-operation" data-type="number" data-step="{{ step }}" data-name="plus" data-max="{{ max }}" data-min="{{ min }}"><i class="fa fa-plus"></i></span><span class="multioptions-operation" data-type="number" data-name="minus" data-step="{{ step }}" data-max="{{ max }}" data-min="{{ min }}"><i class="fa fa-minus"></i></span></div><div class="ui-moi-value-inputnumber"><input data-name="{{ name }}" class="ui-moi-save ui-moi-value-numbertext" type="text" value="{{ value }}"{{ if def }} placeholder="{{ def }}"{{ fi }} data-max="{{ max }}" data-min="{{ max }}" data-type="number" /></div>');
	var Tboolean = Tangular.compile('<div data-name="{{ name }}" data-type="boolean" class="ui-moi-save multioptions-operation ui-moi-value-boolean{{ if value }} checked{{ fi }}"><i class="fa fa-check"></i></div>');
	var Tdate = Tangular.compile('<div class="ui-moi-value-inputdate-buttons"><span class="multioptions-operation" data-type="date" data-name="date"><i class="fa fa-calendar"></i></span></div><div class="ui-moi-value-inputdate"><input class="ui-moi-save ui-moi-date" data-name="{{ name }}" type="text" value="{{ value | format(\'yyyy-MM-dd\') }}" placeholder="dd.mm.yyyy" maxlength="10" data-type="date" /></div>');
	var Tcolor = null;
	var skip = false;
	var mapping = null;

	self.getter = null;
	self.novalidate();

	self.init = function() {
		window.Tmultioptionscolor = Tangular.compile('<div class="ui-moi-value-colors ui-moi-save" data-name="{{ name }}" data-value="{{ value }}">{0}</div>'.format(['#ED5565', '#DA4453', '#FC6E51', '#E9573F', '#FFCE54', '#F6BB42', '#A0D468', '#8CC152', '#48CFAD', '#37BC9B', '#4FC1E9', '#3BAFDA', '#5D9CEC', '#4A89DC', '#AC92EC', '#967ADC', '#EC87C0', '#D770AD', '#F5F7FA', '#E6E9ED', '#CCD1D9', '#AAB2BD', '#656D78', '#434A54', '#000000'].map(function(n) { return '<span data-value="{0}" data-type="color" class="multioptions-operation" style="background-color:{0}"><i class="fa fa-check-circle"></i></span>'.format(n); }).join('')));
	};

	self.form = function() {};

	self.make = function() {

		Tcolor = window.Tmultioptionscolor;
		self.aclass('ui-multioptions');

		var el = self.find('script');

		if (el.length) {
			self.remap(el.html());
			el.remove();
		}

		self.event('click', '.multioptions-operation', function(e) {
			var el = $(this);
			var name = el.attrd('name');
			var type = el.attrd('type');

			e.stopPropagation();

			if (type === 'date') {
				el = el.parent().parent().find('input');
				FIND('calendar').show(el, el.val().parseDate(), function(date) {
					el.val(date.format('yyyy-MM-dd'));
					self.$save();
				});
				return;
			}

			if (type === 'color') {
				el.parent().find('.selected').rclass('selected');
				el.aclass('selected');
				self.$save();
				return;
			}

			if (type === 'boolean') {
				el.tclass('checked');
				self.$save();
				return;
			}

			if (type === 'number') {
				var input = el.parent().parent().find('input');
				var step = (el.attrd('step') || '0').parseInt();
				var min = el.attrd('min');
				var max = el.attrd('max');

				if (!step)
					step = 1;

				if (min)
					min = min.parseInt();

				if (max)
					max = max.parseInt();

				var value;

				if (name === 'plus') {
					value = input.val().parseInt() + step;
					if (max !== 0 && max && value > max)
						value = max;
					input.val(value);
				} else {
					value = input.val().parseInt() - step;
					if (min !== 0 && min && value < min)
						value = min;
					input.val(value);
				}
				self.$save();
				return;
			}

			self.form(type, el.parent().parent().find('input'), name);
			return;
		});

		self.event('change', 'select', self.$save);
		self.event('input', 'input', self.$save);

		self.event('click', '.ui-moi-date', function(e) {
			e.stopPropagation();
		});

		self.event('focus', '.ui-moi-date', function() {
			var el = $(this);
			FIND('calendar').toggle(el, el.val().parseDate(), function(date) {
				el.val(date.format('yyyy-MM-dd'));
				self.$save();
			});
		});
	};

	self.remap = function(js) {
		var fn = new Function('option', js);
		mapping = {};
		fn(self.mapping);
		self.refresh();
		self.change(false);
	};

	self.remap2 = function(callback) {
		mapping = {};
		callback(self.mapping);
		self.refresh();
		self.change(false);
	};

	self.mapping = function(key, label, def, type, max, min, step, validator) {
		if (typeof(type) === 'number') {
			validator = step;
			step = min;
			min = max;
			max = type;
			type = 'number';
		} else if (!type)
			type = def instanceof Date ? 'date' : typeof(def);

		var values;

		if (type instanceof Array) {

			values = [];

			type.forEach(function(val) {
				values.push({ text: val.text === undefined ? val : val.text, value: val.value === undefined ? val : val.value });
			});

			type = 'array';
		}

		if (validator && typeof(validator) !== 'function')
			validator = null;

		mapping[key] = { name: key, label: label, type: type.toLowerCase(), def: def, max: max, min: min, step: step, value: def, values: values, validator: validator };
	};

	self.$save = function() {
		setTimeout2('multioptions.' + self._id, self.save, 150);
	};

	self.save = function() {
		var obj = self.get();
		var values = self.find('.ui-moi-save');

		Object.keys(mapping).forEach(function(key) {

			var opt = mapping[key];
			var el = values.filter('[data-name="{0}"]'.format(opt.name));

			if (el.hclass('ui-moi-value-colors')) {
				obj[key] = el.find('.selected').attrd('value');
				return;
			}

			if (el.hclass('ui-moi-value-boolean')) {
				obj[key] = el.hclass('checked');
				return;
			}

			if (el.hclass('ui-moi-date')) {
				obj[key] = el.val().parseDate();
				return;
			}

			if (el.hclass('ui-moi-value-inputtext')) {
				obj[key] = el.val();
				return;
			}

			if (el.hclass('ui-moi-value-numbertext')) {
				obj[key] = el.val().parseInt();
				return;
			}

			if (el.hclass('ui-moi-value-numbertext')) {
				obj[key] = el.val().parseInt();
				return;
			}

			if (el.hclass('ui-multioptions-select')) {
				var index = el.val().parseInt();
				var val = opt.values[index];
				obj[key] = val ? val.value : null;
				if (obj[key] && obj[key].value)
					obj[key] = obj[key].value;
				return;
			}
		});

		skip = true;
		self.set(obj);
		self.change(true);
	};

	self.setter = function(options) {

		if (!options || skip || !mapping) {
			skip = false;
			return;
		}

		var builder = [];
		Object.keys(mapping).forEach(function(key) {

			var option = mapping[key];

			// option.name
			// option.label
			// option.type (lowercase)
			// option.def
			// option.value
			// option.max
			// option.min
			// option.step

			option.value = options[key] || option.def;

			var value = '';

			switch (option.type) {
				case 'string':
					value = Tinput(option);
					break;
				case 'number':
					value = Tnumber(option);
					break;
				case 'boolean':
					value = Tboolean(option);
					break;
				case 'color':
					value = Tcolor(option);
					break;
				case 'array':
					value = Tselect(option);
					break;
				case 'date':
					value = Tdate(option);
					break;
			}

			builder.push('<div class="ui-multioptions-item"><div class="ui-moi-name">{0}</div><div class="ui-moi-value">{1}</div></div>'.format(option.label, value));
		});

		self.empty().html(builder);

		self.find('.ui-moi-value-colors').each(function() {
			var el = $(this);
			var value = el.attrd('value');
			el.find('[data-value="{0}"]'.format(value)).aclass('selected');
		});
	};
});

COMPONENT('form', function(self, config) {

	var W = window;
	var header = null;
	var csspos = {};

	if (!W.$$form) {
		W.$$form_level = W.$$form_level || 1;
		W.$$form = true;
		$(document).on('click', '.ui-form-button-close', function() {
			SET($(this).attr('data-path'), '');
			W.$$form_level--;
		});

		$(window).on('resize', function() {
			SETTER('form', 'resize');
		});

		$(document).on('click', '.ui-form-container', function(e) {
			var el = $(e.target);
			if (!(el.hclass('ui-form-container-padding') || el.hclass('ui-form-container')))
				return;
			var form = $(this).find('.ui-form');
			var cls = 'ui-form-animate-click';
			form.aclass(cls);
			setTimeout(function() {
				form.rclass(cls);
			}, 300);
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			EXEC(config.submit, self);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && EXEC(config.cancel, self);
		self.hide();
	};

	self.hide = function() {
		self.set('');
	};

	self.resize = function() {
		if (!config.center || self.hclass('hidden'))
			return;
		var ui = self.find('.ui-form');
		var fh = ui.innerHeight();
		var wh = $(W).height();
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		var icon;

		if (config.icon)
			icon = '<i class="fa fa-{0}"></i>'.format(config.icon);
		else
			icon = '<i></i>';

		$(document.body).append('<div id="{0}" class="hidden ui-form-container"><div class="ui-form-container-padding"><div class="ui-form" style="max-width:{1}px"><div class="ui-form-title"><button class="ui-form-button-close" data-path="{2}"><i class="fa fa-times"></i></button>{4}<span>{3}</span></div></div></div>'.format(self._id, config.width || 800, self.path, config.title, icon));

		var el = $('#' + self._id);
		el.find('.ui-form').get(0).appendChild(self.element.get(0));
		self.rclass('hidden');
		self.replace(el);

		header = self.virtualize({ title: '.ui-form-title > span', icon: '.ui-form-title > i' });

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.find('button').on('click', function() {
			W.$$form_level--;
			switch (this.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!this.disabled && self[this.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]').get(0).disabled && setTimeout(function() {
				self.submit(self.hide);
			}, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (init)
			return;
		switch (key) {
			case 'icon':
				header.icon.rclass(header.icon.attr('class'));
				value && header.icon.aclass('fa fa-' + value);
				break;
			case 'title':
				header.title.html(value);
				break;
			case 'width':
				value !== prev && self.find('.ui-form').css('max-width', value + 'px');
				break;
		}
	};

	self.setter = function(value) {

		setTimeout2('noscroll', function() {
			$('html').tclass('noscroll', $('.ui-form-container').not('.hidden').length ? true : false);
		}, 50);

		var isHidden = value !== config.if;

		self.toggle('hidden', isHidden);

		setTimeout2('formreflow', function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			self.release(true);
			self.find('.ui-form').rclass('ui-form-animate');
			return;
		}

		self.resize();
		self.release(false);

		config.reload && EXEC(config.reload, self);
		config.default && DEFAULT(config.default, true);

		if (!isMOBILE && config.autofocus) {
			var el = self.find(config.autofocus === true ? 'input[type="text"],select,textarea' : config.autofocus);
			el.length && el.eq(0).focus();
		}

		if (W.$$form_level < 1)
			W.$$form_level = 1;

		W.$$form_level++;
		self.css('z-index', W.$$form_level * 10);
		self.element.scrollTop(0);

		setTimeout(function() {
			self.element.scrollTop(0);
			self.find('.ui-form').aclass('ui-form-animate');
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.id, function() {
			self.css('z-index', (W.$$form_level * 10) + 1);
		}, 1000);
	};
});

COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {
		self.event('click', config.selector || '.exec', function() {
			var el = $(this);
			var attr = el.attr('data-exec');
			var path = el.attr('data-path');
			attr && EXEC(attr, el);
			path && SET(path, new Function('return ' + el.attr('data-value'))());
		});
	};
});

COMPONENT('shortcuts', function(self) {

	var items = [];
	var length = 0;

	self.singleton();
	self.readonly();
	self.blind();

	self.make = function() {
		$(window).on('keydown', function(e) {
			if (length) {

				for (var i = 0; i < length; i++) {
					var o = items[i];
					if (o.fn(e)) {
						if (o.prevent) {
							e.preventDefault();
							e.stopPropagation();
						}
						setTimeout(function(o, e) {
							o.callback(e);
						}, 100, o, e);
					}
				}
			}
		});
	};

	self.register = function(shortcut, callback, prevent) {
		var builder = [];
		shortcut.split('+').trim().forEach(function(item) {
			var lower = item.toLowerCase();
			switch (lower) {
				case 'ctrl':
				case 'alt':
				case 'shift':
					builder.push('e.{0}Key'.format(lower));
					return;
				case 'win':
				case 'meta':
				case 'cmd':
					builder.push('e.metaKey');
					return;
				case 'space':
					builder.push('e.keyCode===32');
					return;
				case 'tab':
					builder.push('e.keyCode===9');
					return;
				case 'esc':
					builder.push('e.keyCode===27');
					return;
				case 'enter':
					builder.push('e.keyCode===13');
					return;
				case 'backspace':
				case 'del':
				case 'delete':
					builder.push('(e.keyCode===8||e.keyCode===127)');
					return;
				case 'up':
					builder.push('e.keyCode===38');
					return;
				case 'down':
					builder.push('e.keyCode===40');
					return;
				case 'right':
					builder.push('e.keyCode===39');
					return;
				case 'left':
					builder.push('e.keyCode===37');
					return;
				case 'f1':
				case 'f2':
				case 'f3':
				case 'f4':
				case 'f5':
				case 'f6':
				case 'f7':
				case 'f8':
				case 'f9':
				case 'f10':
				case 'f11':
				case 'f12':
					var a = item.toUpperCase();
					builder.push('e.key===\'{0}\''.format(a));
					return;
				case 'capslock':
					builder.push('e.which===20');
					return;
			}

			var num = item.parseInt();
			if (num)
				builder.push('e.which===' + num);
			else
				builder.push('e.key===\'{0}\''.format(item));

		});

		items.push({ fn: new Function('e', 'return ' + builder.join('&&')), callback: callback, prevent: prevent });
		length = items.length;
		return self;
	};
});

COMPONENT('binder', function(self) {

	var keys, keys_unique;

	self.readonly();
	self.blind();

	self.make = function() {
		self.watch('*', self.autobind);
		self.scan();

		self.on('component', function() {
			setTimeout2(self.id, self.scan, 200);
		});

		self.on('destroy', function() {
			setTimeout2(self.id, self.scan, 200);
		});
	};

	self.autobind = function(path) {
		var mapper = keys[path];

		if (!mapper)
			return;

		var template = {};

		for (var i = 0, length = mapper.length; i < length; i++) {
			var item = mapper[i];
			var value = GET(item.path);
			var element = item.selector ? item.element.find(item.selector) : item.element;
			template.value = value;
			item.classes && classes(element, item.classes(value));

			var is = true;

			if (item.visible) {
				is = item.visible(value) ? true : false;
				element.tclass('hidden', !is);
			}

			if (is) {
				item.html && element.html(item.Ta ? item.html(template) : item.html(value));
				item.disable && element.prop('disabled', item.disable(value));
				item.src && element.attr('src', item.src(value));
			}
		}
	};

	function classes(element, val) {
		var add = '';
		var rem = '';
		val.split(' ').forEach(function(item) {
			switch (item.substring(0, 1)) {
				case '+':
					add += (add ? ' ' : '') + item.substring(1);
					break;
				case '-':
					rem += (rem ? ' ' : '') + item.substring(1);
					break;
				default:
					add += (add ? ' ' : '') + item;
					break;
			}
		});
		rem && element.rclass(rem);
		add && element.aclass(add);
	}

	function decode(val) {
		return val.replace(/&#39;/g, '\'');
	}

	self.prepare = function(code) {
		return code.indexOf('=>') === -1 ? FN('value=>' + decode(code)) : FN(decode(code));
	};

	self.scan = function() {
		keys = {};
		keys_unique = {};
		self.find('[data-b]').each(function() {

			var el = $(this);
			var path = el.attrd('b').replace('%', 'jctmp.');
			var arr = path.split('.');
			var p = '';

			var classes = el.attrd('b-class');
			var html = el.attrd('b-html');
			var visible = el.attrd('b-visible');
			var disable = el.attrd('b-disable');
			var selector = el.attrd('b-selector');
			var src = el.attrd('b-src');
			var obj = el.data('data-b');

			keys_unique[path] = true;

			if (!obj) {
				obj = {};
				obj.path = path;
				obj.element = el;
				obj.classes = classes ? self.prepare(classes) : undefined;
				obj.visible = visible ? self.prepare(visible) : undefined;
				obj.disable = disable ? self.prepare(disable) : undefined;
				obj.selector = selector ? selector : null;
				obj.src = src ? self.prepare(src) : undefined;

				if (el.attrd('b-template') === 'true') {
					var tmp = el.find('script[type="text/html"]');
					var str = '';

					if (tmp.length)
						str = tmp.html();
					else
						str = el.html();

					if (str.indexOf('{{') !== -1) {
						obj.html = Tangular.compile(str);
						obj.Ta = true;
						tmp.length && tmp.remove();
					}
				} else
					obj.html = html ? self.prepare(html) : undefined;

				el.data('data-b', obj);
			}

			for (var i = 0, length = arr.length; i < length; i++) {
				p += (p ? '.' : '') + arr[i];
				if (keys[p])
					keys[p].push(obj);
				else
					keys[p] = [obj];
			}
		});

		Object.keys(keys_unique).forEach(function(key) {
			self.autobind(key, GET(key));
		});

		return self;
	};
});

COMPONENT('checkbox', function(self, config) {

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass('ui-checkbox-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass().aclass('fa fa-' + value);
				break;
		}
	};

	self.make = function() {
		self.aclass('ui-checkbox');
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
		self.event('click', function() {
			if (config.disabled)
				return;
			self.dirty(false);
			self.getter(!self.get(), 2, true);
		});
	};

	self.setter = function(value) {
		self.toggle('ui-checkbox-checked', value ? true : false);
	};
});

COMPONENT('radiobutton', function(self, config) {

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'required':
				self.find('.ui-radiobutton-label').tclass('ui-radiobutton-label-required', value);
				break;
			case 'type':
				self.type = config.type;
				break;
			case 'label':
				self.find('.ui-radiobutton-label').html(value);
				break;
			case 'items':
				self.find('span').remove();
				var builder = [];
				value.split(',').forEach(function(item) {
					item = item.split('|');
					builder.push('<span data-value="{0}"><i class="fa fa-circle-o"></i>{1}</span>'.format(item[0] || item[1], item[1] || item[0]));
				});
				self.append(builder.join(''));
				self.refresh();
				break;
		}
	};

	self.make = function() {
		var builder = [];
		var label = config.label || self.html();
		label && builder.push('<div class="ui-radiobutton-label{1}">{0}</div>'.format(label, config.required ? ' ui-radiobutton-label-required' : ''));
		self.aclass('ui-radiobutton');
		self.event('click', 'span', function() {
			if (config.disabled)
				return;
			var value = self.parser($(this).attr('data-value'));
			self.dirty(false, true);
			self.getter(value, 2);
		});
		self.html(builder.join(''));
		config.items && self.reconfigure('items:' + config.items);
		config.type && (self.type = config.type);
	};

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value ? true : false;
	};

	self.setter = function(value) {
		self.find('span').each(function() {
			var el = $(this);
			var is = el.attr('data-value') === (value == null ? null : value.toString());
			el.tclass('ui-radiobutton-selected', is);
			el.find('.fa').tclass('fa-circle-o', !is).tclass('fa-circle', is);
		});
	};
});