sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/Device",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, Device, JSONModel) {
  "use strict";

  return UIComponent.extend("sap.mm.material.Component", {
    metadata: { manifest: "json" },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
      this.setModel(new JSONModel(Device), "device");
      this.setModel(new JSONModel({
        MaterialNumber: "", MaterialType: "", IndustrySector: "", MaterialDescription: "",
        BaseUnitOfMeasure: "KG", MaterialGroup: "", PurchasingGroup: "",
        GrossWeight: null, NetWeight: null, WeightUnit: "KG",
        Volume: null, VolumeUnit: "L", Plant: "", StorageLocation: "",
        MRPType: "", LotSize: "", ReorderPoint: null, SafetyStock: null,
        ValuationClass: "", PriceControl: "V",
        MovingAveragePrice: null, StandardPrice: null, Currency: "VND"
      }), "newMaterial");
    }
  });
});
