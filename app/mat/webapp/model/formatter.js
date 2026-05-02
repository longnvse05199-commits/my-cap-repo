sap.ui.define([], function () {
  "use strict";
  return {
    materialTypeState: function (sType) {
      return { FERT: "Success", HALB: "Warning", ROH: "Information", VERP: "None" }[sType] || "None";
    },
    statusState: function (sStatus) {
      return sStatus === "Active" ? "Success" : "Error";
    }
  };
});
