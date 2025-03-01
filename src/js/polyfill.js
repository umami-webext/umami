Object.getByPath = function(o, s) {
	s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
	s = s.replace(/^\./, ''); // strip a leading dot
	var a = s.split('.');
	for (var i = 0, n = a.length; i < n; ++i) {
		var k = a[i];
		if (k in o) {
			o = o[k];
		} else {
			return;
		}
	}
	return o;
}

Object.setByPath = function(o, s, v) {
	s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
	s = s.replace(/^\./, ''); // strip a leading dot
	var a = s.split('.');
	for (var i = 0, n = a.length - 1; i < n; ++i) {
		var k = a[i];
		if (!(k in o)) {
			o[k] = {};
		}
		o = o[k];
	}
	return o[a[i]] = v;
}