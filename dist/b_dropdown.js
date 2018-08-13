(function() {
  define('b_dropdown', ['jquery'], function($) {
    var Dropdown, Option;
    Dropdown = (function() {
      class Dropdown {
        /*
        @param $parentEl
        @param JSONData
        @param opts
        @return {Dropdown}

        Renders a HTML select structure based on given JSON data, inserts it into the given $parentEl and creates a new
        Dropdown based on the rendered select structure.
        */
        static createDropdownFromJSON($parentEl, JSONData, opts) {
          var $selectEl;
          $selectEl = this._renderSelectFromJSON($parentEl, JSONData);
          return new Dropdown($selectEl, opts);
        }

        /*
        @param $parentEl
        @param JSONData
        @return {jQuery}

        Renders a HTML select structure based on given JSON data, inserts it into the given $parentEl.
        */
        static _renderSelectFromJSON($parentEl, JSONData) {
          var $newOption, $selectEl, j, len, option, ref;
          $selectEl = $('<select></select>');
          $parentEl.append($selectEl);
          if (JSONData.name) {
            $selectEl.attr('name', JSONData.name);
          }
          ref = JSONData.options;
          for (j = 0, len = ref.length; j < len; j++) {
            option = ref[j];
            $newOption = $('<option></option>');
            $selectEl.append($newOption);
            if (option.value) {
              $newOption.val(option.value);
            }
            if (option.disabled) {
              $newOption.prop('disabled', true);
            }
            if (option.label) {
              $newOption.text(option.label);
            }
          }
          return $selectEl;
        }

        constructor(el, opts) {
          var renderData;
          /*
          @param evt
          @return {void 0}
          @private

          Handler for the click event on mock option HTML elements.
          Calls an update on the dropdown.
          */
          this._handleMockOptionSelection = this._handleMockOptionSelection.bind(this);
          /*
          @return {void 0}
          @private

          Handler for the select element change event.
          Calls an update on the dropdown.
          */
          this._handleChange = this._handleChange.bind(this);
          /*
          @param evt
          @return {void 0}
          @private

          Handler for the click event on the header button of the mock structure.
          Toggles the mocks open state.
          */
          this._handleToggleBtnClick = this._handleToggleBtnClick.bind(this);
          /*
          @param evt
          @private

          Handler that will be bound to the windows click event.
          Calls close if the click was outside the select and outside the mock.
          */
          this._handleWindowClick = this._handleWindowClick.bind(this);
          /*
          @return {Dropdown}

          Closes the mock menu.
          */
          this.closeMock = this.closeMock.bind(this);
          /*
          @return {Dropdown}

          Opens the mock menu.
          */
          this.openMock = this.openMock.bind(this);
          /*
          @return {Option}

          Selects the first option, no matter if it is used as placeholder or not.
          */
          this.resetSelection = this.resetSelection.bind(this);
          /*
          @return {Option}

          Selects an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
          the corresponding HTML element.
          */
          this.select = this.select.bind(this);
          /*
          @return {option}

          Selects the first option that contains the given value or does nothing if no option has this value.
          */
          this.selectOptionByValue = this.selectOptionByValue.bind(this);
          /*
          @return {Dropdown}

          Toggles the open state of the mock menu.
          */
          this.toggleMock = this.toggleMock.bind(this);
          this.$selectEl = $(el);
          this.$realOptions = this.$selectEl.children('option');
          this.$selectEl.data('jsobject', this);
          this.opts = $.extend({}, this.defaultOpts, opts || {});
          // Throw error if the provided element is no select HTML element
          if (this.$selectEl.prop('tagName') !== 'SELECT') {
            throw "The provided HTML element is no <select> element";
          }
          // Get render information for the mock structure from the select structure
          renderData = this._getRenderDataFromSelectStructure(this.$selectEl);
          // Get the selected option index from the select structure if no selected option index is set in the opts
          if (!this.opts.selectedOption && (renderData.selectedOption != null)) {
            this.opts.selectedOption = renderData.selectedOption;
          }
          // Set the top element of the mock structure
          this.$mockEl = $('<div class="bJS_dropdown b_dropdown"></div>');
          this.$selectEl.before(this.$mockEl);
          // Add b_dropdown styling class to the select element
          this.$selectEl.addClass('b_dropdown-select');
          // Render the mock structure based on the extracted information from the select structure
          this._renderMockHTMLFromData(this.$mockEl, renderData);
          // Get jQuery collections that wrap important HTML elements of the mock structure
          this.$mockToggleHeader = this.$mockEl.find('.bJS_dropdown-toggle');
          this.$mockMenu = this.$mockEl.find('ul');
          this.$mockOptions = this.$mockMenu.children('li');
          // Init data object, that saves the state of the dropdown
          this.data = {
            isMockOpen: false,
            isDisabled: false,
            ddOptions: this._initDropdownOptions()
          };
          // Array in which the b_dropdown change handlers will be stored
          this.changeHandlers = [];
          // Set static header to mock header if provided
          if (this.opts.staticHeader) {
            this.$mockToggleHeader.html('<span>' + this.opts.staticHeader + '</span>');
          }
          // - - - - - - - - - - - - - - - - - - - - - - #
          //	Trigger functions to update mock correctly
          // - - - - - - - - - - - - - - - - - - - - - - #

          // Select initial option if provided or the first option
          if ((this.opts.selectedOption != null) && this.opts.selectedOption >= 0) {
            this.select(this.opts.selectedOption, true);
          } else {
            this.select(0, true);
          }
          // Disable select if opts disabled is true
          if (this.opts.disabled === false) {
            this.enable();
          } else if (this.opts.disabled || this.$selectEl.prop('disabled')) {
            this.disable();
          }
          // Bind all events
          this._bindEvents();
        }

        /*
        @param $targetEl
        @param renderData
        @return {jQuery}
        @private

        Renders the mock structure based on information that was extracted from the select structure
        */
        _renderMockHTMLFromData($targetEl, renderData) {
          var $mockMenu, $mockMenuWrap, $newOptionEl, i, j, label, len, option, ref, value;
          if (renderData.selectId) {
            $targetEl.data('for', renderData.selectId);
          }
          $targetEl.append($('<button type="button" class="bJS_dropdown-toggle b_dropdown-toggle"></button>'));
          $mockMenuWrap = $('<div class="b_dropdown-menuWrap"></div>');
          $targetEl.append($mockMenuWrap);
          $mockMenu = $('<ul></ul>');
          $mockMenuWrap.append($mockMenu);
          ref = renderData.options;
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            option = ref[i];
            if (typeof option === 'string') {
              label = option;
              value = option;
            } else {
              value = option.value;
              label = option.label || value;
            }
            $newOptionEl = $('<li data-value="' + value + '"></li>');
            $mockMenu.append($newOptionEl);
            $newOptionEl.text(label);
            if (option.disabled) {
              $newOptionEl.addClass('b_dropdown-disabled');
            }
            if (i === 0 && this.opts.firstOptionIsPlaceholder) {
              $newOptionEl.addClass('b_dropdown-placeholder');
            }
          }
          return $targetEl;
        }

        /*
        @param $selectElement
        @return {{options: Array}}
        @private

        Gets information from the select about how the mock structure must be rendered.
        */
        _getRenderDataFromSelectStructure($selectElement) {
          var $optionsEls, renderData, selectId;
          renderData = {
            options: []
          };
          selectId = $selectElement.attr('id');
          if (selectId) {
            renderData.selectId = renderData;
          }
          $optionsEls = $selectElement.children('option');
          //Extract information from each option
          $optionsEls.each(function(index) {
            var $option, nextOptionObject;
            nextOptionObject = {};
            $option = $(this);
            nextOptionObject.label = $option.text() || "";
            nextOptionObject.value = $option.val() || nextOptionObject.label;
            nextOptionObject.disabled = $option.prop('disabled');
            nextOptionObject.selected = $option.prop('selected');
            if (nextOptionObject.selected) {
              renderData.selectedOption = index;
            }
            return renderData.options.push(nextOptionObject);
          });
          return renderData;
        }

        /*
        return {Array}
        @private

        Initializes the option objects that will be used to manage the dropdowns state.
        */
        _initDropdownOptions() {
          var ddOptions, dropddown;
          dropddown = this;
          ddOptions = [];
          this.$realOptions.each(function() {
            return ddOptions.push(new Option(dropddown, this));
          });
          return ddOptions;
        }

        _bindEvents() {
          this.$mockToggleHeader.on('click', this._handleToggleBtnClick);
          this.$mockOptions.on('click', this._handleMockOptionSelection);
          this.$selectEl.on('change', this._handleChange);
          $(window).on('click', this._handleWindowClick);
          return this;
        }

        _handleMockOptionSelection(evt) {
          this.select(this.$mockOptions.index($(evt.currentTarget)));
          this.closeMock();
          return void 0;
        }

        _handleChange() {
          var option;
          option = this._updateSelect(this.$realOptions.filter(':selected'), false, true, false, true);
          if (option && !option.isDisabled()) {
            this.closeMock();
          }
          return void 0;
        }

        _handleToggleBtnClick(evt) {
          evt.preventDefault();
          this.toggleMock();
          return void 0;
        }

        _handleWindowClick(evt) {
          if (!this.isDisabled() && this.isMockOpen() && !$.contains(this.$mockEl.get(0), evt.target)) {
            this.closeMock();
          }
          return void 0;
        }

        /*
        @return {Dropdown}
        @private

        Unbinds all handlers that was bound on _bindEvents() from their events.
        */
        _unbindEvents() {
          this.$mockToggleHeader.off('click', this._handleToggleBtnClick);
          this.$mockOptions.off('click', this._handleMockOptionSelection);
          this.$selectEl.off('change', this._handleChange);
          $(window).off('click', this._handleWindowClick);
          this.removeChangeHandlers();
          return this;
        }

        /*
        @param indexElementOrOption
        @param updateSelect
        @param updateMock
        @param triggerChange
        @param callChangeHandlers
        @return {Option}
        @private

        Private helper function that is essentially for the state and view update of the dropdown.
        */
        _updateSelect(indexElementOrOption, updateSelect, updateMock, triggerChange) {
          var option, timestamp;
          option = this.getOption(indexElementOrOption);
          timestamp = new Date();
          if (option && !option.isDisabled()) {
            this.data.selectedOption = option;
            if (updateSelect) {
              option.$realEl.prop('selected', true);
            }
            if (updateMock) {
              this.$mockToggleHeader.text(option.getLabel());
            }
            if (triggerChange) {
              this.$selectEl.trigger('change');
            }
          }
          return option;
        }

        closeMock() {
          if (!this.isDisabled()) {
            this.$mockEl.removeClass('b_dropdown-open');
            this.data.isMockOpen = false;
          }
          return this;
        }

        /*
        @return {void 0}

        Destroys the dropdown. That means:
        - Removing b_dropdown specific css classes.
        - Destroying the mock structure.
        - Unbinding all b_dropdown event handlers.
        */
        destroy() {
          // Clean up HTML structure
          this.$selectEl.removeClass('b_dropdown-select');
          this.$mockEl.remove();
          // Remove event bindings
          this._unbindEvents();
          // Delete this object
          delete this;
          return void 0;
        }

        /*
        @return {Dropdown}

        Sets the select as disabled and emulates a similar behaviour for the mock.
        */
        disable() {
          this.closeMock();
          this.$selectEl.prop('disabled', true);
          this.$mockEl.addClass('b_dropdown-disabled');
          this.data.isDisabled = true;
          return this;
        }

        /*
        @param indexElementOrOption
        @return {Option}

        Disables an option and its mock pendant.
        */
        disableOption(indexElementOrOption) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            option.disable();
          }
          return option;
        }

        /*
        @return {Dropdown}

        Enables the select and its mock pendant.
        */
        enable() {
          this.$selectEl.prop('disabled', false);
          this.$mockEl.removeClass('b_dropdown-disabled');
          this.data.isDisabled = false;
          return this;
        }

        enableOption(indexElementOrOption) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            option.enable();
          }
          return option;
        }

        /*
        @return {string}

        Returns the label of an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
        the corresponding HTML element.
        */
        getLabelForOption(indexElementOrOption) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            return option.getLabel();
          }
          return void 0;
        }

        /*
        @param indexElementOrOption
        @return {Option}

        Returns an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
        the corresponding HTML element.
        */
        getOption(indexElementOrOption) {
          var $el, index;
          if (indexElementOrOption instanceof Option) {
            index = this.data.ddOptions.indexOf(indexElementOrOption);
          } else if (indexElementOrOption instanceof $) {
            $el = indexElementOrOption;
          } else if (indexElementOrOption instanceof HTMLElement) {
            $el = $(indexElementOrOption);
          } else if (typeof indexElementOrOption === 'number') {
            index = indexElementOrOption;
          } else {
            throw "Provided argument is neither a html element nor a number";
          }
          if ($el) {
            index = this.$realOptions.index($el);
          }
          return this.getOptionByIndex(index);
        }

        /*
        @param optionIndex
        @return {Option}

        Returns an option based on its order in the select structure.
        */
        getOptionByIndex(optionIndex) {
          if (this.data.ddOptions.length > optionIndex) {
            return this.data.ddOptions[optionIndex];
          } else {
            return void 0;
          }
        }

        /*
        @return {number}

        Returns the index of the selected option.
        */
        getSelectedIndex() {
          var selectedOption;
          selectedOption = this.getSelectedOption();
          if (selectedOption) {
            return selectedOption.getIndex();
          } else {
            return 0;
          }
        }

        /*
        @return {string}

        Returns the text that is displayed in the option or an empty string.
        */
        getSelectedLabel() {
          var selectedOption;
          selectedOption = this.getSelectedOption();
          if (selectedOption) {
            return selectedOption.getLabel();
          } else {
            return "";
          }
        }

        /*
        @return {Option}

        Returns the Option object of the selected option.
        */
        getSelectedOption() {
          return this.data.selectedOption || this.getOptionByIndex(0);
        }

        /*
        @return {*}

        Returns the value of the selected option.
        */
        getSelectedValue() {
          var selectedOption;
          selectedOption = this.getSelectedOption();
          if (selectedOption) {
            return selectedOption.getValue();
          } else {
            return void 0;
          }
        }

        /*
        @return {string}

        Returns the value of an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
        the corresponding HTML element.
        */
        getValueOfOption(indexElementOrOption) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            return option.getValue();
          }
          return void 0;
        }

        /*
        @return {boolean}

        Returns true if the select is disabled.
        */
        isDisabled() {
          return this.data.isDisabled;
        }

        /*
        @return {boolean}

        Returns true if the mock menu is open.
        */
        isMockOpen() {
          return this.data.isMockOpen || false;
        }

        /*
        @param changeHandler

        Unbinds handlers from the change event.
        */
        offChange(changeHandler) {
          var handlerIndex;
          handlerIndex = this.changeHandlers.indexOf(changeHandler);
          this.$selectEl.off('change', changeHandler);
          if (handlerIndex >= 0) {
            this.changeHandlers.splice(handlerIndex, 1);
            return changeHandler;
          }
          return void 0;
        }

        /*
        @param changeHandler

        Binds handlers to the change event.
        */
        onChange(changeHandler) {
          this.changeHandlers.push(changeHandler);
          this.$selectEl.on('change', changeHandler);
          return changeHandler;
        }

        openMock() {
          if (!this.isDisabled()) {
            this.$mockEl.addClass('b_dropdown-open');
            this.data.isMockOpen = true;
          }
          return this;
        }

        /*
        @return {Array}

        Removes all handlers that where bound via the onChange function.
        */
        removeChangeHandlers() {
          var changeHandler, j, len, ref, removedHandlers;
          ref = this.changeHandlers;
          for (j = 0, len = ref.length; j < len; j++) {
            changeHandler = ref[j];
            this.offChange(changeHandler);
          }
          removedHandlers = this.changeHandlers;
          this.changeHandlers = [];
          return removedHandlers;
        }

        resetSelection() {
          return this.select(0);
        }

        select(indexElementOrOption) {
          return this._updateSelect(indexElementOrOption, true, true, true, true);
        }

        selectOptionByValue(value) {
          var j, len, option, ref;
          ref = this.data.ddOptions;
          for (j = 0, len = ref.length; j < len; j++) {
            option = ref[j];
            if (option.getValue() == value) {
              return this.select(option);
            }
          }
          return void 0;
        }

        /*
        @return {string}

        Sets the label for an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
        the corresponding HTML element.
        */
        setLabelForOption(indexElementOrOption, label) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            return option.setLabel(label);
          }
          return void 0;
        }

        /*
        @return {string}

        Sets the value for an option either based on its corresponding index, its HTML element or a jQuery collection that wraps
        the corresponding HTML element.
        */
        setValueForOption(indexElementOrOption, value) {
          var option;
          option = this.getOption(indexElementOrOption);
          if (option) {
            return option.setValue(value);
          }
          return void 0;
        }

        toggleMock() {
          if (this.isMockOpen()) {
            this.closeMock();
          } else {
            this.openMock();
          }
          return this;
        }

      };

      Dropdown.prototype.defaultOpts = {
        disabled: void 0,
        firstOptionIsPlaceholder: false,
        hideOriginalSelect: true
      };

      return Dropdown;

    }).call(this);
    // Private dropdown option helper class
    Option = class Option {
      constructor(dropdown, option) {
        this.dropdown = dropdown;
        if (option instanceof Option) {
          this.$realEl = option.$realEl;
        } else if (option instanceof $) {
          this.$realEl = option.eq(0);
        } else if (option instanceof HTMLElement) {
          this.$realEl = $(option);
        } else if (typeof option === 'number') {
          this.index = option;
          this.$realEl = this.dropdown.$realOptions.eq(option);
        } else {
          throw "Provided argument is neither a html element nor a number";
        }
        if (this.index == null) {
          this.index = this.dropdown.$realOptions.index(this.$realEl);
        }
        this.$mockEl = this.dropdown.$mockOptions.eq(this.index);
        this.isDisabled();
        this.getLabel();
        this.getValue();
      }

      /*
      @return {Option}

      Disables the option and its views.
      */
      disable() {
        this.disabled = true;
        this.$realEl.prop('disabled', true);
        this.$mockEl.addClass('b_dropdown-disabled');
        return this;
      }

      /*
      @return {Option}

      Enables the option and its views.
      */
      enable() {
        this.disabled = false;
        this.$realEl.prop('disabled', false);
        this.$mockEl.removeClass('b_dropdown-disabled');
        return this;
      }

      /*
      @return {jQuery}

      Returns the corresponding <option> HTML element of the option, wrapped in a jQuery collection.
      */
      get$RealEl() {
        return this.$realEl;
      }

      /*
      @return {jQuery}

      Returns the corresponding mock HTML element of the option, wrapped in a jQuery collection.
      */
      get$MockEl() {
        return this.$mockEl;
      }

      /*
      @return {number}

      Returns the index of the option.
      */
      getIndex(refresh) {
        if (refresh || (this.index == null)) {
          this.index = this.dropdown.$realOptions.index(this.$realEl);
        }
        return this.index;
      }

      /*
      @return {string}

      Returns the text that is visible in the option, if available.
      */
      getLabel(refresh) {
        if (refresh || (this.label == null)) {
          this.label = this.$realEl.text();
        }
        return this.label;
      }

      /*
      @return {string}

      Returns the value of the option, if available.
      */
      getValue(refresh) {
        if (refresh || (this.value == null)) {
          this.value = this.$realEl.val() || "";
        }
        return this.value;
      }

      /*
      @return {string}

      Sets the text that will be displayed as option.
      */
      setLabel(label) {
        this.label = label;
        this.$realEl.text(label);
        this.$mockEl.text(label);
        if (this.isSelected()) {
          this.dropdown.$mockToggleHeader.text(label);
        }
        return label;
      }

      /*
      @return {string}

      Sets the value of the option.
      */
      setValue(value) {
        this.value = value;
        this.$realEl.val(value);
        return value;
      }

      /*
      @return {boolean}

      Returns true if the option is disabled. Otherwise false.
      */
      isDisabled(refresh) {
        if (refresh || (this.disabled == null)) {
          this.disabled = this.$realEl.prop('disabled');
        }
        return this.disabled;
      }

      /*
      @return {boolean}

      Return true if the option is selected. Otherwise false.
      */
      isSelected() {
        return this.$realEl.prop('selected');
      }

    };
    return Dropdown;
  });

}).call(this);
