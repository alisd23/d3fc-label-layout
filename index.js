(function () {
    'use strict';

    function ascending (a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector (compare) {
      if (compare.length === 1) compare = ascendingComparator(compare);
      return {
        left: function left(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
          }
          return lo;
        },
        right: function right(a, x, lo, hi) {
          if (lo == null) lo = 0;
          if (hi == null) hi = a.length;
          while (lo < hi) {
            var mid = lo + hi >>> 1;
            if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
          }
          return lo;
        }
      };
    }

    function ascendingComparator(f) {
      return function (d, x) {
        return ascending(f(d), x);
      };
    }

    var ascendingBisect = bisector(ascending);

    function range (start, stop, step) {
      start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

      var i = -1,
          n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
          range = new Array(n);

      while (++i < n) {
        range[i] = start + i * step;
      }

      return range;
    }

    function sum (array, f) {
      var s = 0,
          n = array.length,
          a,
          i = -1;

      if (f == null) {
        while (++i < n) {
          if (a = +array[i]) s += a;
        } // Note: zero and null are equivalent.
      } else {
        while (++i < n) {
          if (a = +f(array[i], i, array)) s += a;
        }
      }

      return s;
    }

    var regexify = (function (strsOrRegexes) {
        return strsOrRegexes.map(function (strOrRegex) {
            return typeof strOrRegex === 'string' ? new RegExp('^' + strOrRegex + '$') : strOrRegex;
        });
    });

    var include = (function () {
        for (var _len = arguments.length, inclusions = Array(_len), _key = 0; _key < _len; _key++) {
            inclusions[_key] = arguments[_key];
        }

        inclusions = regexify(inclusions);
        return function (name) {
            return inclusions.some(function (inclusion) {
                return inclusion.test(name);
            }) && name;
        };
    });

    var createTransform = function createTransform(transforms) {
        return function (name) {
            return transforms.reduce(function (name, fn) {
                return name && fn(name);
            }, name);
        };
    };

    var createReboundMethod = function createReboundMethod(target, source, name) {
        var method = source[name];
        if (typeof method !== 'function') {
            throw new Error('Attempt to rebind ' + name + ' which isn\'t a function on the source object');
        }
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var value = method.apply(source, args);
            return value === source ? target : value;
        };
    };

    var rebindAll = (function (target, source) {
        for (var _len2 = arguments.length, transforms = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
            transforms[_key2 - 2] = arguments[_key2];
        }

        var transform = createTransform(transforms);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.keys(source)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var name = _step.value;

                var result = transform(name);
                if (result) {
                    target[result] = createReboundMethod(target, source, name);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return target;
    });

    var rebind = (function (target, source) {
        for (var _len = arguments.length, names = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            names[_key - 2] = arguments[_key];
        }

        return rebindAll(target, source, include.apply(undefined, names));
    });

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace (name) {
      var prefix = name += "",
          i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name;
    }

    function creatorInherit(name) {
      return function () {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml ? document.createElement(name) : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function () {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator (name) {
      var fullname = namespace(name);
      return (fullname.local ? creatorFixed : creatorInherit)(fullname);
    }

    var matcher = function matcher(selector) {
      return function () {
        return this.matches(selector);
      };
    };

    if (typeof document !== "undefined") {
      var element = document.documentElement;
      if (!element.matches) {
        var vendorMatches = element.webkitMatchesSelector || element.msMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
        matcher = function matcher(selector) {
          return function () {
            return vendorMatches.call(this, selector);
          };
        };
      }
    }

    var matcher$1 = matcher;

    var filterEvents = {};

    var event = null;

    if (typeof document !== "undefined") {
      var element$1 = document.documentElement;
      if (!("onmouseenter" in element$1)) {
        filterEvents = { mouseenter: "mouseover", mouseleave: "mouseout" };
      }
    }

    function filterContextListener(listener, index, group) {
      listener = contextListener(listener, index, group);
      return function (event) {
        var related = event.relatedTarget;
        if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
          listener.call(this, event);
        }
      };
    }

    function contextListener(listener, index, group) {
      return function (event1) {
        var event0 = event; // Events can be reentrant (e.g., focus).
        event = event1;
        try {
          listener.call(this, this.__data__, index, group);
        } finally {
          event = event0;
        }
      };
    }

    function parseTypenames(typenames) {
      return typenames.trim().split(/^|\s+/).map(function (t) {
        var name = "",
            i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return { type: t, name: name };
      });
    }

    function onRemove(typename) {
      return function () {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;else delete this.__on;
      };
    }

    function onAdd(typename, value, capture) {
      var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
      return function (d, i, group) {
        var on = this.__on,
            o,
            listener = wrap(value, i, group);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
            this.addEventListener(o.type, o.listener = listener, o.capture = capture);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, capture);
        o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
        if (!on) this.__on = [o];else on.push(o);
      };
    }

    function selection_on (typename, value, capture) {
      var typenames = parseTypenames(typename + ""),
          i,
          n = typenames.length,
          t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      if (capture == null) capture = false;
      for (i = 0; i < n; ++i) {
        this.each(on(typenames[i], value, capture));
      }return this;
    }

    function none() {}

    function selector (selector) {
      return selector == null ? none : function () {
        return this.querySelector(selector);
      };
    }

    function selection_select (select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function empty() {
      return [];
    }

    function selectorAll (selector) {
      return selector == null ? empty : function () {
        return this.querySelectorAll(selector);
      };
    }

    function selection_selectAll (select) {
      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection(subgroups, parents);
    }

    function selection_filter (match) {
      if (typeof match !== "function") match = matcher$1(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function sparse (update) {
      return new Array(update.length);
    }

    function selection_enter () {
      return new Selection(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function appendChild(child) {
        return this._parent.insertBefore(child, this._next);
      },
      insertBefore: function insertBefore(child, next) {
        return this._parent.insertBefore(child, next);
      },
      querySelector: function querySelector(selector) {
        return this._parent.querySelector(selector);
      },
      querySelectorAll: function querySelectorAll(selector) {
        return this._parent.querySelectorAll(selector);
      }
    };

    function constant$1 (x) {
      return function () {
        return x;
      };
    }

    var keyPrefix = "$"; // Protect against keys like “__proto__”.

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = {},
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
          if (keyValue in nodeByKeyValue) {
            exit[i] = node;
          } else {
            nodeByKeyValue[keyValue] = node;
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = keyPrefix + key.call(parent, data[i], i, data);
        if (node = nodeByKeyValue[keyValue]) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue[keyValue] = null;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
          exit[i] = node;
        }
      }
    }

    function selection_data (value, key) {
      if (!value) {
        data = new Array(this.size()), j = -1;
        this.each(function (d) {
          data[++j] = d;
        });
        return data;
      }

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant$1(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = value.call(parent, parent && parent.__data__, j, parents),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
            previous._next = next || null;
          }
        }
      }

      update = new Selection(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    function selection_exit () {
      return new Selection(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_merge (selection) {

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection(merges, this._parents);
    }

    function selection_order () {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort (compare) {
      if (!compare) compare = ascending$1;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection(sortgroups, this._parents).order();
    }

    function ascending$1(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call () {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes () {
      var nodes = new Array(this.size()),
          i = -1;
      this.each(function () {
        nodes[++i] = this;
      });
      return nodes;
    }

    function selection_node () {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size () {
      var size = 0;
      this.each(function () {
        ++size;
      });
      return size;
    }

    function selection_empty () {
      return !this.node();
    }

    function selection_each (callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove(name) {
      return function () {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function () {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, value) {
      return function () {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS(fullname, value) {
      return function () {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction(name, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS(fullname, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr (name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
      }

      return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
    }

    function defaultView (node) {
        return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
        node.document && node // node is a Window
        || node.defaultView; // node is a Document
    }

    function styleRemove(name) {
      return function () {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, value, priority) {
      return function () {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction(name, value, priority) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style (name, value, priority) {
      var node;
      return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : defaultView(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function () {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function () {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function () {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];else this[name] = v;
      };
    }

    function selection_property (name, value) {
      return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function add(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function remove(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function contains(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node),
          i = -1,
          n = names.length;
      while (++i < n) {
        list.add(names[i]);
      }
    }

    function classedRemove(node, names) {
      var list = classList(node),
          i = -1,
          n = names.length;
      while (++i < n) {
        list.remove(names[i]);
      }
    }

    function classedTrue(names) {
      return function () {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function () {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function () {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed (name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()),
            i = -1,
            n = names.length;
        while (++i < n) {
          if (!list.contains(names[i])) return false;
        }return true;
      }

      return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant(value) {
      return function () {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function () {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text (value) {
      return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function () {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function () {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html (value) {
      return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise () {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower () {
      return this.each(lower);
    }

    function selection_append (name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function () {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert (name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function () {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove () {
      return this.each(remove);
    }

    function selection_datum (value) {
        return arguments.length ? this.property("__data__", value) : this.node().__data__;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (event) {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function () {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function () {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch (type, params) {
      return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
    }

    var root = [null];

    function Selection(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection([[document.documentElement]], root);
    }

    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: selection_select,
      selectAll: selection_selectAll,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      merge: selection_merge,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch
    };

    function select (selector) {
        return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
    }

    function selectAll (selector) {
        return typeof selector === "string" ? new Selection([document.querySelectorAll(selector)], [document.documentElement]) : new Selection([selector == null ? [] : selector], root);
    }

    var functor = (function (d) {
      return typeof d === 'function' ? d : function () {
        return d;
      };
    });

    // "Caution: avoid interpolating to or from the number zero when the interpolator is used to generate
    // a string (such as with attr).
    // Very small values, when stringified, may be converted to scientific notation and
    // cause a temporarily invalid attribute or style property value.
    // For example, the number 0.0000001 is converted to the string "1e-7".
    // This is particularly noticeable when interpolating opacity values.
    // To avoid scientific notation, start or end the transition at 1e-6,
    // which is the smallest value that is not stringified in exponential notation."
    // - https://github.com/mbostock/d3/wiki/Transitions#d3_interpolateNumber
    var effectivelyZero = 1e-6;

    // Wrapper around d3's selectAll/data data-join, which allows decoration of the result.
    // This is achieved by appending the element to the enter selection before exposing it.
    // A default transition of fade in/out is also implicitly added but can be modified.

    function dataJoinUtil (element, className) {
        element = element || 'g';

        var key = function key(_, i) {
            return i;
        };

        var dataJoin = function dataJoin(container, data) {
            data = data || function (d) {
                return d;
            };

            // update
            var selector = className == null ? element : element + '.' + className;
            var selected = container.selectAll(selector)
            // in order to support nested selections, they can be filtered
            // to only return immediate children of the container
            .filter(function () {
                return this.parentNode === container.node();
            });
            var updateSelection = selected.data(data, key);

            // enter
            // when container is a transition, entering elements fade in (from transparent to opaque)
            // N.B. insert() is used to create new elements, rather than append(). insert() behaves in a special manner
            // on enter selections - entering elements will be inserted immediately before the next following sibling
            // in the update selection, if any.
            // This helps order the elements in an order consistent with the data, but doesn't guarantee the ordering;
            // if the updating elements change order then selection.order() would be required to update the order.
            // (#528)
            var enterSelection = updateSelection.enter().insert(element) // <<<--- this is the secret sauce of this whole file
            .attr('class', className);

            // exit
            // when container is a transition, exiting elements fade out (from opaque to transparent)
            var exitSelection = updateSelection.exit();

            // automatically merge in the enter selection
            updateSelection = updateSelection.merge(enterSelection);

            // if transitions are enable inherit the default transition from ancestors
            // and apply a default fade in/out transition
            if (selection.prototype.transition) {
                enterSelection.style('opacity', effectivelyZero);
                updateSelection.transition().style('opacity', 1);
                exitSelection.transition().style('opacity', effectivelyZero);
            }

            // automatically remove nodes in the exit selection
            exitSelection.remove();

            updateSelection.enter = function () {
                return enterSelection;
            };
            updateSelection.exit = function () {
                return exitSelection;
            };

            return updateSelection;
        };

        dataJoin.element = function (x) {
            if (!arguments.length) {
                return element;
            }
            element = x;
            return dataJoin;
        };
        dataJoin.className = function (x) {
            if (!arguments.length) {
                return className;
            }
            className = x;
            return dataJoin;
        };
        dataJoin.key = function (x) {
            if (!arguments.length) {
                return key;
            }
            key = x;
            return dataJoin;
        };

        return dataJoin;
    }

    var layoutLabel = (function (layoutStrategy) {

        var decorate = function decorate() {};
        var size = function size() {
            return [0, 0];
        };
        var position = function position(d, i) {
            return [d.x, d.y];
        };
        var strategy = layoutStrategy || function (x) {
            return x;
        };
        var component = function component() {};

        var dataJoin = dataJoinUtil('g', 'label');

        var label = function label(selection) {

            selection.each(function (data, index, group) {

                var g = dataJoin(select(group[index]), data).call(component);

                // obtain the rectangular bounding boxes for each child
                var nodes = g.nodes();
                var childRects = nodes.map(function (node, i) {
                    var d = select(node).datum();
                    var childPos = position(d, i, nodes);
                    var childSize = size(d, i, nodes);
                    return {
                        hidden: false,
                        x: childPos[0],
                        y: childPos[1],
                        width: childSize[0],
                        height: childSize[1]
                    };
                });

                // apply the strategy to derive the layout. The strategy does not change the order
                // or number of label.
                var layout = strategy(childRects);

                g.attr('style', function (_, i) {
                    return 'display:' + (layout[i].hidden ? 'none' : 'inherit');
                }).attr('transform', function (_, i) {
                    return 'translate(' + layout[i].x + ', ' + layout[i].y + ')';
                })
                // set the layout width / height so that children can use SVG layout if required
                .attr('layout-width', function (_, i) {
                    return layout[i].width;
                }).attr('layout-height', function (_, i) {
                    return layout[i].height;
                }).attr('anchor-x', function (d, i, g) {
                    return position(d, i, g)[0] - layout[i].x;
                }).attr('anchor-y', function (d, i, g) {
                    return position(d, i, g)[1] - layout[i].y;
                });

                g.call(component);

                decorate(g, data, index);
            });
        };

        rebindAll(label, dataJoin, include('key'));
        rebindAll(label, strategy);

        label.size = function () {
            if (!arguments.length) {
                return size;
            }
            size = functor(arguments.length <= 0 ? undefined : arguments[0]);
            return label;
        };

        label.position = function () {
            if (!arguments.length) {
                return position;
            }
            position = functor(arguments.length <= 0 ? undefined : arguments[0]);
            return label;
        };

        label.component = function () {
            if (!arguments.length) {
                return component;
            }
            component = arguments.length <= 0 ? undefined : arguments[0];
            return label;
        };

        label.decorate = function () {
            if (!arguments.length) {
                return decorate;
            }
            decorate = arguments.length <= 0 ? undefined : arguments[0];
            return label;
        };

        return label;
    });

    var layoutTextLabel = (function (layoutStrategy) {

        var padding = 2;
        var value = function value(x) {
            return x;
        };

        var textJoin = dataJoinUtil('text');
        var rectJoin = dataJoinUtil('rect');
        var pointJoin = dataJoinUtil('circle');

        var textLabel = function textLabel(selection) {
            selection.each(function (data, index, group) {

                var node = group[index];
                var nodeSelection = select(node);

                var width = Number(node.getAttribute('layout-width'));
                var height = Number(node.getAttribute('layout-height'));
                var rect = rectJoin(nodeSelection, [data]);
                rect.attr('width', width).attr('height', height);

                var anchorX = Number(node.getAttribute('anchor-x'));
                var anchorY = Number(node.getAttribute('anchor-y'));
                var circle = pointJoin(nodeSelection, [data]);
                circle.attr('r', 2).attr('cx', anchorX).attr('cy', anchorY);

                var text = textJoin(nodeSelection, [data]);
                text.enter().attr('dy', '0.9em').attr('transform', 'translate(' + padding + ', ' + padding + ')');
                text.text(value);
            });
        };

        textLabel.padding = function () {
            if (!arguments.length) {
                return padding;
            }
            padding = arguments.length <= 0 ? undefined : arguments[0];
            return textLabel;
        };

        textLabel.value = function () {
            if (!arguments.length) {
                return value;
            }
            value = functor(arguments.length <= 0 ? undefined : arguments[0]);
            return textLabel;
        };

        return textLabel;
    });

    var isIntersecting = function isIntersecting(a, b) {
        return !(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y);
    };

    var intersect = (function (a, b) {
        if (isIntersecting(a, b)) {
            var left = Math.max(a.x, b.x);
            var right = Math.min(a.x + a.width, b.x + b.width);
            var top = Math.max(a.y, b.y);
            var bottom = Math.min(a.y + a.height, b.y + b.height);
            return (right - left) * (bottom - top);
        } else {
            return 0;
        }
    });

    // computes the area of overlap between the rectangle with the given index with the
    // rectangles in the array
    var collisionArea = function collisionArea(rectangles, index) {
        return sum(rectangles.map(function (d, i) {
            return index === i ? 0 : intersect(rectangles[index], d);
        }));
    };

    // computes the total overlapping area of all of the rectangles in the given array
    var totalCollisionArea = function totalCollisionArea(rectangles) {
        return sum(rectangles.map(function (_, i) {
            return collisionArea(rectangles, i);
        }));
    };

    // searches for a minimum when applying the given accessor to each item within the supplied array.
    // The returned array has the following form:
    // [minumum accessor value, datum, index]
    var minimum = (function (data, accessor) {
        return data.map(function (dataPoint, index) {
            return [accessor(dataPoint, index), dataPoint, index];
        }).reduce(function (accumulator, dataPoint) {
            return accumulator[0] > dataPoint[0] ? dataPoint : accumulator;
        }, [Number.MAX_VALUE, null, -1]);
    });

    var getPlacement = function getPlacement(x, y, width, height, location) {
        return {
            x: x,
            y: y,
            width: width,
            height: height,
            location: location
        };
    };

    // returns all the potential placements of the given label
    var placements = (function (label) {
        var x = label.x;
        var y = label.y;
        var width = label.width;
        var height = label.height;
        return [getPlacement(x, y, width, height, 'bottom-right'), getPlacement(x - width, y, width, height, 'bottom-left'), getPlacement(x - width, y - height, width, height, 'top-left'), getPlacement(x, y - height, width, height, 'top-right'), getPlacement(x, y - height / 2, width, height, 'middle-right'), getPlacement(x - width / 2, y, width, height, 'bottom-center'), getPlacement(x - width, y - height / 2, width, height, 'middle-left'), getPlacement(x - width / 2, y - height, width, height, 'top-center')];
    });

    var layoutGreedy = (function () {

        var bounds = [0, 0];

        var scorer = function scorer(layout) {
            var areaOfCollisions = totalCollisionArea(layout);

            var areaOutsideContainer = 0;
            if (bounds[0] !== 0 && bounds[1] !== 0) {
                (function () {
                    var containerRect = {
                        x: 0, y: 0, width: bounds[0], height: bounds[1]
                    };
                    areaOutsideContainer = sum(layout.map(function (d) {
                        var areaOutside = d.width * d.height - intersect(d, containerRect);
                        // this bias is twice as strong as the overlap penalty
                        return areaOutside * 2;
                    }));
                })();
            }

            return areaOfCollisions + areaOutsideContainer;
        };

        var strategy = function strategy(data) {
            var rectangles = [];

            data.forEach(function (rectangle) {
                // add this rectangle - in all its possible placements
                var candidateConfigurations = placements(rectangle).map(function (placement) {
                    var copy = rectangles.slice();
                    copy.push(placement);
                    return copy;
                });

                // keep the one the minimises the 'score'
                rectangles = minimum(candidateConfigurations, scorer)[1];
            });

            return rectangles;
        };

        strategy.bounds = function () {
            if (!arguments.length) {
                return bounds;
            }
            bounds = arguments.length <= 0 ? undefined : arguments[0];
            return strategy;
        };

        return strategy;
    });

    var randomItem = function randomItem(array) {
        return array[randomIndex(array)];
    };

    var randomIndex = function randomIndex(array) {
        return Math.floor(Math.random() * array.length);
    };

    var cloneAndReplace = function cloneAndReplace(array, index, replacement) {
        var clone = array.slice();
        clone[index] = replacement;
        return clone;
    };

    var layoutAnnealing = (function () {

        var temperature = 1000;
        var cooling = 1;
        var bounds = [0, 0];

        var getPotentialState = function getPotentialState(originalData, iteratedData) {
            // For one point choose a random other placement.
            var victimLabelIndex = randomIndex(originalData);
            var label = originalData[victimLabelIndex];

            var replacements = placements(label);
            var replacement = randomItem(replacements);

            return cloneAndReplace(iteratedData, victimLabelIndex, replacement);
        };

        var scorer = function scorer(layout) {
            // penalise collisions
            var collisionArea = totalCollisionArea(layout);

            // penalise rectangles falling outside of the bounds
            var areaOutsideContainer = 0;
            if (bounds[0] !== 0 && bounds[1] !== 0) {
                (function () {
                    var containerRect = {
                        x: 0, y: 0, width: bounds[0], height: bounds[1]
                    };
                    areaOutsideContainer = sum(layout.map(function (d) {
                        var areaOutside = d.width * d.height - intersect(d, containerRect);
                        // this bias is twice as strong as the overlap penalty
                        return areaOutside * 2;
                    }));
                })();
            }

            // penalise certain orientations
            var orientationBias = sum(layout.map(function (d) {
                // this bias is not as strong as overlap penalty
                var area = d.width * d.height / 4;
                if (d.location === 'bottom-right') {
                    area = 0;
                }
                if (d.location === 'middle-right' || d.location === 'bottom-center') {
                    area = area / 2;
                }
                return area;
            }));

            return collisionArea + areaOutsideContainer + orientationBias;
        };

        var strategy = function strategy(data) {

            var originalData = data;
            var iteratedData = data;

            var lastScore = Infinity;
            var currentTemperature = temperature;
            while (currentTemperature > 0) {

                var potentialReplacement = getPotentialState(originalData, iteratedData);

                var potentialScore = scorer(potentialReplacement);

                // Accept the state if it's a better state
                // or at random based off of the difference between scores.
                // This random % helps the algorithm break out of local minima
                var probablityOfChoosing = Math.exp((lastScore - potentialScore) / currentTemperature);
                if (potentialScore < lastScore || probablityOfChoosing > Math.random()) {
                    iteratedData = potentialReplacement;
                    lastScore = potentialScore;
                }

                currentTemperature -= cooling;
            }
            return iteratedData;
        };

        strategy.temperature = function () {
            if (!arguments.length) {
                return temperature;
            }
            temperature = arguments.length <= 0 ? undefined : arguments[0];
            return strategy;
        };

        strategy.cooling = function () {
            if (!arguments.length) {
                return cooling;
            }
            cooling = arguments.length <= 0 ? undefined : arguments[0];
            return strategy;
        };

        strategy.bounds = function () {
            if (!arguments.length) {
                return bounds;
            }
            bounds = arguments.length <= 0 ? undefined : arguments[0];
            return strategy;
        };

        return strategy;
    });

    // iteratively remove the rectangle with the greatest area of collision
    var layoutRemoveOverlaps = (function (adaptedStrategy) {

        adaptedStrategy = adaptedStrategy || function (x) {
            return x;
        };

        var removeOverlaps = function removeOverlaps(layout) {

            layout = adaptedStrategy(layout);

            // returns a function that computes the area of overlap for rectangles
            // in the given layout array
            var scorerForLayout = function scorerForLayout(layout) {
                return function (_, i) {
                    return -collisionArea(layout, i);
                };
            };

            var iterate = true;
            do {
                // apply the overlap calculation to visible rectangles
                var filteredLayout = layout.filter(function (d) {
                    return !d.hidden;
                });
                var min = minimum(filteredLayout, scorerForLayout(filteredLayout));
                if (min[0] < 0) {
                    // hide the rectangle with the greatest collision area
                    min[1].hidden = true;
                } else {
                    iterate = false;
                }
            } while (iterate);

            return layout;
        };

        rebindAll(removeOverlaps, adaptedStrategy);

        return removeOverlaps;
    });

    var layoutBoundingBox = (function () {

        var bounds = [0, 0];

        var strategy = function strategy(data) {
            return data.map(function (d, i) {
                var tx = d.x;
                var ty = d.y;
                if (tx + d.width > bounds[0]) {
                    tx -= d.width;
                }

                if (ty + d.height > bounds[1]) {
                    ty -= d.height;
                }
                return { height: d.height, width: d.width, x: tx, y: ty };
            });
        };

        strategy.bounds = function () {
            if (!arguments.length) {
                return bounds;
            }
            bounds = arguments.length <= 0 ? undefined : arguments[0];
            return strategy;
        };

        return strategy;
    });



    var fc = Object.freeze({
    	layoutLabel: layoutLabel,
    	layoutTextLabel: layoutTextLabel,
    	layoutGreedy: layoutGreedy,
    	layoutAnnealing: layoutAnnealing,
    	layoutRemoveOverlaps: layoutRemoveOverlaps,
    	layoutBoundingBox: layoutBoundingBox,
    	layoutIntersect: intersect
    });

    var labelPadding = 4;
    var label = layoutTextLabel().padding(labelPadding).value(function (d) {
        return d.data;
    });

    var width = 700;
    var height = 350;
    var data = [];

    // we intercept the strategy in order to capture the final layout and compute statistics
    var strategyInterceptor = function strategyInterceptor(strategy) {
        var interceptor = function interceptor(layout) {
            var start = new Date();
            var finalLayout = strategy(layout);
            var time = new Date() - start;

            // record some statistics on this strategy
            if (!interceptor.time) {
                Object.defineProperty(interceptor, 'time', { enumerable: false, writable: true });
                Object.defineProperty(interceptor, 'hidden', { enumerable: false, writable: true });
                Object.defineProperty(interceptor, 'overlap', { enumerable: false, writable: true });
            }
            var visibleLabels = finalLayout.filter(function (d) {
                return !d.hidden;
            });
            interceptor.time = time;
            interceptor.hidden = finalLayout.length - visibleLabels.length;
            interceptor.overlap = sum(visibleLabels.map(function (label, index) {
                return sum(visibleLabels.filter(function (_, i) {
                    return i !== index;
                }).map(function (d) {
                    return intersect(d, label);
                }));
            }));
            return finalLayout;
        };
        rebind(interceptor, strategy, 'bounds');
        return interceptor;
    };

    var strategy = strategyInterceptor(layoutAnnealing());

    var generateData = function generateData() {
        var dataCount = document.getElementById('label-count').value;
        data = range(0, document.getElementById('label-count').value).map(function (_, i) {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                data: 'node-' + i
            };
        });
    };

    var svg = select('svg').attr('width', width).attr('height', height);

    var render = function render() {
        svg.selectAll('g').remove();

        svg.append('g').selectAll('circle').data(data).enter().append('circle').attr('r', 2).attr('cx', function (d) {
            return d.x;
        }).attr('cy', function (d) {
            return d.y;
        });

        var labels = layoutLabel(strategy).size(function (_, i, g) {
            var textSize = select(g[i]).select('text').node().getBBox();
            return [textSize.width + labelPadding * 2, textSize.height + labelPadding * 2];
        }).component(label);

        svg.append('g').datum(data).call(labels);

        var statsElement = document.getElementById('statistics');
        statsElement.innerHTML = '<b>Execution Time:</b> ' + strategy.time + 'ms, ' + '<b>Hidden Labels:</b> ' + strategy.hidden + ', ' + '<b>Overlap Area:</b> ' + strategy.overlap.toFixed(2);
    };

    var getStrategyName = function getStrategyName() {
        var selector = document.getElementById('strategy-selector');
        return selector.options[selector.selectedIndex].value;
    };

    select('#strategy-selector').on('change', function () {
        var strategyName = getStrategyName();
        selectAll('.annealing-field').attr('style', 'display:' + (strategyName === 'annealing' ? 'visible' : 'none'));
    });

    select('#strategy-form .btn').on('click', function () {
        event.preventDefault();
        var strategyName = getStrategyName();
        strategy = function strategy(d) {
            return d;
        };
        if (strategyName !== 'none') {
            strategy = fc[strategyName]();
        }
        if (strategyName === 'annealing') {
            strategy.temperature(document.getElementById('temperature').value);
            strategy.cooling(document.getElementById('cooling').value);
        }
        var enforceBounds = document.getElementById('enforce-bounds').checked;
        if (enforceBounds) {
            strategy.bounds([width, height]);
        }
        var removeOverlaps = document.getElementById('remove-overlaps').checked;
        if (removeOverlaps) {
            strategy = layoutRemoveOverlaps(strategy);
        }
        strategy = strategyInterceptor(strategy);
        render();
    });

    select('#labels-form .btn').on('click', function () {
        event.preventDefault();
        generateData();
        render();
    });

    generateData();
    setTimeout(render, 100);

}());