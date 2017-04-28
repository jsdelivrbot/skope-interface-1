// Fill the DB with example data on startup

import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Samples, channelValueMin, channelValueMax } from "/imports/api/samples/collection.js";

Meteor.startup(() => {
  // if the Links collection is empty
  if (Samples.find().count() === 0) {

    const fakeDataExtent = [
      [
        -113.64257812499999,
        33.063924198120645
      ],
      [
        -84.55078125,
        45.089035564831036
      ],
    ];
    const fakeDataQuantity = 1000;
    const filterMin = 0,
          filterMax = 10;
    const fakeDataItems = Array.from({length: fakeDataQuantity}, (value, index) => ({
      "type": "Feature",
      "properties": {
        filterValue: _.random(filterMin, filterMax, false),
        channels: [
          // Alpha
          _.random(channelValueMin, channelValueMax, false),
          // Red
          _.random(channelValueMin, channelValueMax, false),
          // Green
          _.random(channelValueMin, channelValueMax, false),
          // Blue
          _.random(channelValueMin, channelValueMax, false),
        ],
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          _.random(fakeDataExtent[0][0], fakeDataExtent[1][0], true),
          _.random(fakeDataExtent[0][1], fakeDataExtent[1][1], true),
        ]
      }
    }));

    fakeDataItems.forEach((item) => Samples.insert(item));
  }
});
