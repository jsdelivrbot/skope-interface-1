/* eslint class-methods-use-this: off */

import React from 'react';
import objectPath from 'object-path';
import moment from 'moment';
import {
  Tab,
} from 'material-ui/Tabs';
import {
  ListItem,
} from 'material-ui/List';
import {
  RadioButton,
} from 'material-ui/RadioButton';

import {
  getDateAtPrecision,
  getYearStringFromDate,
} from '/imports/ui/helpers';

import {
  RangeWithInput,
} from '/imports/ui/components/SliderWithInput';

import SubComponentClass from './SubComponentClass';

import * as mapLayerRenderers from './dataset.mapLayerRenderers';

export default
class TabBaseClass extends SubComponentClass {
  // Override these.
  static tabIcon = null;
  static tabLabel = '';
  static tabStyle = {};
  static requiredProps = [];

  constructor (...args) {
    super(...args);

    this._timeoutIds = {};
    this._intervalIds = {};
  }

  get isActiveTab () {
    return this.component.state.activeTab === this.name;
  }

  get isTabEnabled () {
    return this.constructor.requiredProps.every((key) => {
      return key in this.props && this.props[key];
    });
  }

  /**
   * @return {string}
   */
  get selectedVariableId () {
    return this.sharedState.selectedVariableId;
  }
  set selectedVariableId (value) {
    this.setSharedState({
      selectedVariableId: value,
    });
  }

  /**
   * @return {boolean}
   */
  get hasSelectedVariable () {
    return this.selectedVariableId !== '';
  }

  /**
   * @return {[Date, Date]}
   */
  get dateRangeTemporal () {
    return this.sharedState.dateRangeTemporal;
  }
  set dateRangeTemporal (value) {
    this.setSharedState({
      dateRangeTemporal: value,
    });
  }
  /**
   * @return {[Date, Date]}
   */
  get dateRange () {
    return this.sharedState.dateRange;
  }
  set dateRange (value) {
    this.setSharedState({
      dateRange: value,
    });
  }
  /**
   * @return {Date}
   */
  get dateRangeStart () {
    return this.dateRange[0];
  }
  /**
   * @return {Date}
   */
  get dateRangeEnd () {
    return this.dateRange[1];
  }

  /**
   * @return {Date}
   */
  get currentLoadedDate () {
    return this.sharedState.currentLoadedDate;
  }
  set currentLoadedDate (value) {
    const maxDate = this.dateRangeEnd;
    const minDate = this.dateRangeStart;
    let preciseDate = this.getPreciseDateWithinTimespan(value);

    if (preciseDate.valueOf() > maxDate.valueOf()) {
      preciseDate = maxDate;
    }

    if (preciseDate.valueOf() < minDate.valueOf()) {
      preciseDate = minDate;
    }

    if (preciseDate.valueOf() === this.currentLoadedDate.valueOf()) {
      return;
    }

    this.setSharedState({
      currentLoadedDate: preciseDate,
    });
  }

  /**
   * @return {Object}
   */
  get focusGeometry () {
    return this.sharedState.focusGeometry;
  }
  set focusGeometry (value) {
    this.setSharedState({
      focusGeometry: value || this.component.boundaryGeometry,
    });
  }

  /**
   * Make sure the given date stays within the dataset timespan and has the proper resolution.
   * @param {Date} date
   * @returns {Date}
   */
  getPreciseDateWithinTimespan = (date) => {
    let preciseDate = getDateAtPrecision(date, this.component.temporalPrecision);

    if (preciseDate.valueOf() > this.component.timespan.period.lte.valueOf()) {
      preciseDate = this.component.timespan.period.lte;
    }

    if (preciseDate.valueOf() < this.component.timespan.period.gte.valueOf()) {
      preciseDate = this.component.timespan.period.gte;
    }

    return preciseDate;
  };

  /**
   * Returns true if the variable is selected.
   * @param {string} variableId
   * @returns {boolean}
   */
  isSelectedVariable (variableId) {
    return variableId === this.selectedVariableId;
  }

  /**
   * @param {string} panelId
   * @returns {boolean}
   */
  isPanelOpen = (panelId) => {
    return panelId in this.sharedState.isPanelOpen
           ? this.sharedState.isPanelOpen[panelId]
           // Open all panels by default.
           : true;
  };

  /**
   * @param {string} panelId
   */
  togglePanelOpenState = (panelId) => {
    this.setSharedState({
      isPanelOpen: {
        [panelId]: !this.isPanelOpen(panelId),
      },
    });
  };

  /**
   * @param {Date} date
   * @returns {number}
   */
  getSliderValueFromDate = (date) => this.component.getFrameIndexInTimespan(date);

  /**
   * @param {number} value
   * @return {Date}
   */
  getDateFromSliderValue = (value) => this.component.getDateFromFrameIndex(value);

  /**
   * @param {string} s
   * @return {Date}
   */
  getDateFromYearStringInput = (s) => {
    // Fill year string to 4 digits otherwise parsing will fail.
    const isBcYear = s[0] === '-';
    const absYearStr = isBcYear ? s.substr(1) : s;
    const zeroPadding = '0'.repeat(Math.max(4 - absYearStr.length, 0));
    const paddedAbsYearStr = zeroPadding + absYearStr;
    const paddedYearStr = isBcYear ? `-${paddedAbsYearStr}` : paddedAbsYearStr;

    const date = this.component.parsePreciseDateString(paddedYearStr);

    if (!date) {
      throw new Error('Invalid date.');
    }

    return date;
  };

  // Use these helpers to manage timers so they are properly canceled when the tab becomes inactive.

  /**
   * @param {Function} func
   * @param {number} delay
   * @param {Array<any>} params
   * @return {number}
   */
  setTimeout = (func, delay, ...params) => {
    const timeoutId = window.setTimeout(func, delay, ...params);
    const timeoutIdStr = String(timeoutId);

    this._timeoutIds[timeoutIdStr] = timeoutId;

    return timeoutId;
  };
  /**
   * @param {number} timeoutId
   */
  clearTimeout = (timeoutId) => {
    const timeoutIdStr = String(timeoutId);

    if (!(timeoutIdStr in this._timeoutIds)) {
      return;
    }

    window.clearTimeout(timeoutId);
    delete this._timeoutIds[timeoutIdStr];
  };
  /**
   * @param {Function} func
   * @param {number} delay
   * @param {Array<any>} params
   * @return {number}
   */
  setInterval = (func, delay, ...params) => {
    const intervalId = window.setInterval(func, delay, ...params);
    const intervalIdStr = String(intervalId);

    this._intervalIds[intervalIdStr] = intervalId;

    return intervalId;
  };
  /**
   * @param {number} intervalId
   */
  clearInterval = (intervalId) => {
    const intervalIdStr = String(intervalId);

    if (!(intervalIdStr in this._intervalIds)) {
      return;
    }

    window.clearInterval(intervalId);
    delete this._intervalIds[intervalIdStr];
  };

  /**
   * Called when this tab becomes active.
   */
  onActivate (event) {
    // Override this.
  }

  /**
   * Called when this tab becomes inactive.
   */
  onDeactivate (event) {
    Object.values(this._timeoutIds).forEach(this.clearTimeout);
    Object.values(this._intervalIds).forEach(this.clearInterval);

    // Override this.
  }

  onChangeDateRange = (event, dateRange) => {
    const preciseDateRange = dateRange.map(this.getPreciseDateWithinTimespan);

    this.dateRangeTemporal = preciseDateRange;
  };

  onFinishDateRange = (event, dateRange) => {
    const preciseDateRange = dateRange.map(this.getPreciseDateWithinTimespan);

    this.dateRange = preciseDateRange;
  };

  /**
   * Requires component as context object.
   * @param {Object} layer
   */
  renderMapLayer = (layer) => {
    if (!(layer.type in mapLayerRenderers)) {
      console.warn(`Unknown layer type “${layer.type}” for layer “${layer.name}”`);
      return null;
    }

    const mapLayerRenderer = mapLayerRenderers[layer.type];
    // @type {Date}
    const dateOfLayer = (typeof this.currentLoadedDate === 'undefined' || this.currentLoadedDate === null)
                        ? this.component.timespan.period.gte
                        : this.currentLoadedDate;

    return mapLayerRenderer.call(this, {
      ...layer,
      extent: this.component.extent,
      visible: this.isSelectedVariable(layer.name),
      // opacity: this.getLayerOpacity(layer.name),
      opacity: 0.7,
    }, {
      YYYY: () => moment(dateOfLayer).format('YYYY'),
      MM: () => moment(dateOfLayer).format('MM'),
      DD: () => moment(dateOfLayer).format('DD'),
    });
  };

  renderMapLayerForSelectedVariable = () => {
    const variableId = this.selectedVariableId;
    const layer = objectPath.get(this.component.variables, [variableId, 'overlay']);

    if (!layer) {
      return null;
    }

    return this.renderMapLayer(layer);
  };

  /**
   * This component is closely associated with the dataset so it can not be
   * independent.
   * Use the `props` parameter to pass customizable options.
   * @param {Object} props
   */
  renderVariableList = () => {
    const variableListItems = Object.entries(this.component.variables)
    .map(([variableId, variable]) => (
      <ListItem
        key={`variable-list-item__${variableId}`}
        className="layer-list__item"
        leftCheckbox={(
          <RadioButton
            value={variableId}
            checked={this.isSelectedVariable(variableId)}
            onCheck={() => this.selectedVariableId = variableId}
          />
        )}
        primaryText={variable.name}
      />
    ));

    return (
      <ListItem
        key="variable-list"
        primaryText="Select variable to display"
        primaryTogglesNestedList
        open={this.isPanelOpen('variable-list')}
        onNestedListToggle={() => this.togglePanelOpenState('variable-list')}
        nestedItems={variableListItems}
      />
    );
  };

  /**
   * This component is closely associated with the dataset so it can not be
   * independent.
   * Use the `props` parameter to pass customizable options.
   * @param {Object} props
   */
  renderTemporalControls = (props = {}) => {
    const {
      disabled,
    } = props;
    const timespan = this.component.timespan;

    return (
      <ListItem
        key="temporal-controls"
        primaryText="Temporal controls"
        primaryTogglesNestedList
        open={this.isPanelOpen('temporal-controls')}
        onNestedListToggle={() => this.togglePanelOpenState('temporal-controls')}
        nestedItems={[
          <ListItem
            disabled
            key="date-range"
            style={{
              padding: '0',
            }}
          >
            <RangeWithInput
              label="Date Range (year)"
              min={timespan.period.gte}
              max={timespan.period.lte}
              value={this.dateRangeTemporal}
              disabled={disabled}
              // (Date) => number
              toSliderValue={this.getSliderValueFromDate}
              // (number) => Date
              fromSliderValue={this.getDateFromSliderValue}
              // (Date) => string
              toInputValue={getYearStringFromDate}
              // (string) => Date
              fromInputValue={this.getDateFromYearStringInput}
              onChange={this.onChangeDateRange}
              onFinish={this.onFinishDateRange}
              inputStyle={{
                width: '60px',
              }}
              sliderProps={{
                handleStyle: [
                  {
                    transform: 'scale(1.4)',
                  },
                ],
              }}
              inputProps={{
                type: 'number',
                min: getYearStringFromDate(timespan.period.gte),
                max: getYearStringFromDate(timespan.period.lte),
              }}
            />
          </ListItem>,
        ]}
      />
    );
  };

  // Override this.
  renderBody () {
    return null;
  }

  render () {
    return (
      <Tab
        className="tab-button"
        label={this.component.renderTabLabel({
          IconComponent: this.constructor.tabIcon,
          label: this.constructor.tabLabel,
        })}
        value={this.name}
        disabled={!this.isTabEnabled}
        style={{
          cursor: false,
          ...this.constructor.tabStyle,
        }}
      >{this.isTabEnabled && this.isActiveTab && this.renderBody()}</Tab>
    );
  }
}