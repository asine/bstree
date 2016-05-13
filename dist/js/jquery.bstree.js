/*
 *  Project:     Ifa tree
 *  Description: The jQuery plugin ifatree enhances the view of a tree build of unordered lists with possibilities to
 *               open or close nodes, add icons and deal with data.
 *               If a data provider is supplied, dynamically-added checkboxes can update these data, also a label is
 *               underlined  when its related node is incomplete.
 *               All generated html classes are modifiables.
 *               Chevron icons and label icons can be customized.
 *  Author:      Guillaume Limberger <glim.dev@gmail.com>
 *  License:     MIT
 *
 *  Notes      : A node is declared 'incomplete' when one of its children checkbox at least is checked and one at least
 *               is unchecked.
 *
 *  HTML code example:
 *  <div id="ROLE_SUPER_ADMIN_tree" class="ifa_tree" data-id="ROLE_SUPER_ADMIN">
 *      <ul>
 *          <li data-id="PCA" data-level="1">
 *              <span>Provence-Alpes-Côte d'Azur</span>
 *              <ul>
 *                  <li data-id="PAC" data-level="2">
 *                       <span>Provence -Alpes- Côte d'Azur</span>
 *                  </li>
 *              </ul>
 *          </li>
 *      </ul>
 *  </div>
 *  <script>
 *      $("document").ready(function (){
 *          $('.ifa_tree').each(function () {
 *              var id = $(this).data('id');
 *              $(this).ifatree();
 *          });
 *      });
 *  </script>
 */

/*!
 The MIT License (MIT)

 Copyright (c) 2016 Guillaume Limberger

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

;( function( $, window, document, undefined ) {

    "use strict";

    var // plugin name
        pluginName = "bstree",

    // key using in $.data()
        dataKey = "plugin_" + pluginName,

    // create the defaults once
        defaults = {
            DEBUG               : false,
            dataSource          : '',                                      // the source control id
            initValues          : '',
            dataSeparator       : ':',                                     // the separator used for the exploded data
            chevronOpened       : '<i class="fa fa-toggle-down fa-lg"></i>',    // the icon used for an opened node
            chevronClosed       : '<i class="fa fa-toggle-right fa-lg"></i>',   // the icon used for a closed node
            isExpanded            : false,                                 // sets if nodes are initially expanded
            nodeClass           : pluginName+'_node',                      //  generic node class
            compositeClass      : pluginName+'_composite',                 //  composite node class
            leafClass           : pluginName+'_leaf',                      //  leaf node class
            childrenClass       : pluginName+'_children',                  //  node children class
            chevronClass        : pluginName+'_chevron',                   //  chevron icon class
            labelClass          : pluginName+'_label',                     //  label class
            iconClass           : pluginName+'_icon',                      //  label icon class
            expandedClass       : pluginName+'_expanded',                  //  opened node class
            closedClass         : pluginName+'_closed',                    //  closed node class
            checkboxClass       : pluginName+'_checkbox',                  //  checkbox class
            incompleteClass     : pluginName+'_incomplete',                //  incomplete node class
            vLineClass          : pluginName+'_vline',
            openTitle           : "Afficher la branche",
            closeTitle          : "Masquer la branche",
            checkboxTitle       : "Attribuer le périmètre"
        };

    // The actual plugin constructor
    function Plugin ( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this._vItem = {
            setInitCount: function (node, settings) {
                var childrenCount = node.children('ul').children('li').length;
                node.children('ul').children(settings._dotVLineClass).attr('data-vitems', childrenCount);
            },
            setCount: function (node, settings, vItem) {
                var count = vItem.getCount(node, settings);
                if (node.hasClass(settings.closedClass)) {
                    count = - count;
                    node.find(settings._dotCompositeClass).each(function (index) {
                        if ($(this).hasClass(settings.expandedClass) && $(this).is('li:last-child')) {
                            count -= vItem.getCount($(this), settings);
                        }
                    });
                }
                else if (node.hasClass(settings.expandedClass)) {
                    node.find(settings._dotCompositeClass).each(function (index) {
                        if ($(this).hasClass(settings.expandedClass) && $(this).is('li:last-child')) {
                            count += vItem.getCount($(this), settings);
                        }
                    });
                }
                if (settings.DEBUG) console.log('count = '+count);
                node.parents(settings._dotCompositeClass).each(function (index) {
                    var $this = $(this);
                    var oldCount = vItem.getCount($this, settings);
                    var newCount = oldCount + count;
                    if (index === 0 && node.is('li:last-child')) {
                        newCount = oldCount;
                    }
                    if (settings.DEBUG) console.log(index+' : '+newCount);
                    $this.children('ul').children(settings._dotVLineClass).attr('data-vitems', newCount);
                    vItem.setHeight($this, settings, vItem);
                });
            },
            getCount: function (node, settings) {
                var nb = node.children('ul').children(settings._dotVLineClass).attr('data-vitems');
                if (undefined == nb) { return -1; }
                return parseInt(nb);
            },
            setHeight: function (node, settings, vItem) {
                var count = vItem.getCount(node, settings);
                var height = 0;
                if (element.hasClass('has-data')) {
                    height = (count - 1) * settings._datavItemHeight + settings._datavLineOffset;
                }
                else {
                    height = (count - 1) * settings._vItemHeight + settings._vLineOffset;
                }
                node.children('ul').children(settings._dotVLineClass).css('height', height);
            }
        };

        // opens a node and sets the associated icon
        this.element.openNode = function (node, settings) {
            node.children('ul').show();
            node.addClass(settings.expandedClass).removeClass(settings.closedClass);
            node.children('div').children(settings._dotChevronClass)
                .html(settings.chevronOpened+'&nbsp;')
                .attr('title', settings.closeTitle);
        };

        // closes a node and sets the associated icon
        this.element.closeNode = function (node, settings) {
            node.children('ul').hide();
            node.addClass(settings.closedClass).removeClass(settings.expandedClass);
            node.children('div').children(settings._dotChevronClass)
                .html(settings.chevronClosed+'&nbsp;')
                .attr('title', settings.openTitle);
        };

        // manage tree with data
        this._data = {};
        if (this.settings.dataSource.length) { // a source of data is provided

            this._data = {

                // delimiter to join/split the source data
                separator           : this.settings.dataSeparator,

                // the data source (jQuery object)
                source              : this.settings.dataSource,

                // initial values from the source
                initValues          : this.settings.initValues.split(this.settings.dataSeparator),

                // stored values
                values              : this.settings.dataSource.val().split(this.settings.dataSeparator),

                /** pushes data to the source */
                push: function () {
                    this.source.val(this.values.join(this.separator));
                },

                /** pulls data from the source */
                pull: function () {
                    this.values = this.source.val().split(this.separator)
                },

                /** removes the 'incomplete' class to the node element and its descendants */
                resetIndeterminate: function (node, settings) {
                    node.removeClass(settings.incompleteClass);
                    node.find(settings._dotCompositeClass).removeClass(settings.incompleteClass);
                    node.children('.checkbox').find(settings._dotCheckboxClass)
                        .prop('indeterminate', false);
                    node.find(settings._dotCompositeClass)
                        .children('.checkbox').find(settings._dotCheckboxClass)
                        .prop('indeterminate', false);
                },

                /** propagates checkbox states to children */
                propagateToChildren: function (node, state, settings) {
                    node.find(settings._dotCheckboxClass).prop('checked', state);
                },

                /** propagates checkbox states to ancestors */
                propagateToParent: function (node, settings) {
                    node.parents(settings._dotNodeClass).each(function () {
                        var $node = $(this);
                        var check = 0;
                        if ($node.children('.checkbox').find(settings._dotCheckboxClass).prop('checked')) {
                            check++;
                        }

                        // get node siblings to compute the checkbox count
                        var $siblings = $node.siblings('li'); // the calling node is not in the sibling collection
                        var checkCount = $siblings.length + 1; // + 1 for the calling node
                        $.each($siblings, function (index, sibling) {
                            var $sibling = $(sibling);
                            // the node checkbox
                            var $checkbox = $sibling.children('.checkbox').find(settings._dotCheckboxClass);
                            if ($checkbox.prop('checked')) { check++; }
                        });
                        if (settings.DEBUG) console.log($node.data('level')+' check = '+check+'/'+checkCount);

                        // determinate the parent node's behaviour
                        var $parentNode = $node.parent('ul').parent('li');
                        if ($parentNode.length) {
                            // the node checkbox
                            var $checkbox = $parentNode.children('.checkbox').find(settings._dotCheckboxClass);

                            if (check == checkCount) { // all siblings are checked
                                $checkbox.prop('indeterminate', false).prop('checked', true);
                            }
                            else if (check == 0) { // no siblings are checked
                                $checkbox.prop('indeterminate', false).prop('checked', false);
                                // verify if children checkboxes are checked
                                if ($parentNode.find('input:checked').length) {
                                    $checkbox.prop('indeterminate', true);
                                }
                            } else { // some siblings are checked
                                $checkbox.prop('indeterminate', true).prop('checked', false);
                            }
                        }
                    });
                },

                /** gather data from leaf nodes checkboxes */
                getLeafData: function (settings) {
                    var newValues = [];
                    element.find(settings._dotCheckboxClass).each(function () {
                        var $node = $(this).closest(settings._dotLeafClass);
                        if ($(this).prop('checked') && $node.length) {
                            var pid = $node.data('id');
                            newValues.push(pid);
                        }
                    });
                    this.values = newValues;
                }
            };
        }

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend( Plugin.prototype, {
        init: function() {
            var
                element  = this.element,
                settings = this.settings,
                vItem    = this._vItem,
                data     = this._data;

            if (element.length == 0) {
                throw pluginName+" - the element is not valid.";
            }

            // internal settings
            settings._dotNodeClass       = '.'+settings.nodeClass;
            settings._dotCompositeClass  = '.'+settings.compositeClass;
            settings._dotLeafClass       = '.'+settings.leafClass;
            settings._dotChildrenClass   = '.'+settings.childrenClass;
            settings._dotChevronClass    = '.'+settings.chevronClass;
            settings._dotExpandedClass   = '.'+settings.expandedClass;
            settings._dotCheckboxClass   = '.'+settings.checkboxClass;
            settings._dotLabelClass      = '.'+settings.labelClass;
            settings._dotIconClass       = '.'+settings.iconClass;
            settings._dotVLineClass      = '.'+settings.vLineClass;
            settings._vLineOffset        = 12;
            settings._datavLineOffset    = 12;
            settings._vItemHeight        = 32;
            settings._datavItemHeight    = 36;

            // adding classes to li elements
            element.find('li').each(function () {
                var $this = $(this);
                if ($this.has('ul').length) {
                    $this.addClass(settings.nodeClass+' '+settings.compositeClass);
                } else {
                    $this.addClass(settings.nodeClass+' '+settings.leafClass);
                }
            });
            // adding classes to ul elements (except the upmost one)
            element.children('ul').find('ul').addClass(settings.childrenClass)
                .prepend('<i class="'+settings.vLineClass+'"></i>');
            // adding classes to labels and wrapping them
            element.find('li > span').addClass(settings.labelClass)
                .wrap('<div></div>').wrap('<label></label>');
            // adding label icons and chevron icons
            element.find(settings._dotLabelClass)
                .before('<span class="'+settings.iconClass+'"></span>')
                .parent('label')
                .before('<span class="'+settings.chevronClass+'"></span>');

            // initially opening/closing nodes according to settings
            element.find(settings._dotCompositeClass).each(function () {
                if (settings.isExpanded) {
                    element.openNode($(this), settings);
                }
                else {
                    element.closeNode($(this), settings);
                    vItem.setInitCount($(this), settings);
                }
            });

            /**
             * Click event on chevron elements
             */
            element.find(settings._dotChevronClass).click(function () {
                var $node = $(this).closest(settings._dotCompositeClass);
                if ($node.hasClass(settings.closedClass)) {
                    element.openNode($node, settings);
                } else if ($node.hasClass(settings.expandedClass)) {
                    element.closeNode($node, settings);
                }
                vItem.setCount($node, settings, vItem);
            });

            /* init tree with data */
            if (!$.isEmptyObject(data)) { // available data
                // adding checkbox elements
                element // add checkboxes
                    .find(settings._dotIconClass)
                    .before('<input type="checkbox" class="'+settings.checkboxClass+'" title="'+settings.checkboxTitle+'">')
                    .before('<span class="c-indicator" title="'+settings.checkboxTitle+'"></span>')
                    .parent('label').addClass('c-input c-checkbox')
                    .parent('div').addClass('checkbox');
                // pulling data from the bound control
                data.pull();

                /**
                 * Change event on checkbox elements
                 */
                element.find(settings._dotCheckboxClass).change(function () {
                    var $this = $(this);

                    if ($this.closest(settings._dotLeafClass).length == 0) { // checkbox of composite node
                        var $node = $(this).closest(settings._dotNodeClass);
                        data.resetIndeterminate($node, settings);
                        if ($this.prop('checked')) {
                            data.propagateToChildren($node, true, settings);
                        } else {
                            data.propagateToChildren($node, false, settings);
                        }
                    }
                    // process parent nodes
                    data.propagateToParent($this, settings);
                    // get data from leaf nodes
                    data.getLeafData(settings);
                    // push data to source
                    data.push();
                });

                for (var i = 0; i < data.initValues.length; i++) {
                    element.find(settings._dotCompositeClass).each(function () {
                        var id = $(this).data('id');
                        if (id == data.initValues[i]) {
                            data.propagateToChildren($(this), true, settings);
                            $(this).find(settings._dotCheckboxClass).change();
                        }
                    });
                }
            }
        }
    } );

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function( options ) {
        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof Plugin) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new Plugin(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
    };

} )( jQuery, window, document );