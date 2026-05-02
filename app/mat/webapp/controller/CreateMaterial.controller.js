sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (Controller, MessageBox, MessageToast) {
  "use strict";

  return Controller.extend("sap.mm.material.controller.CreateMaterial", {
    onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("CreateMaterial").attachPatternMatched(this._onRoute, this);
    },

    _onRoute: function () {
      this.getOwnerComponent().getModel("newMaterial").setData({
        MaterialNumber: "", MaterialType: "", IndustrySector: "M",
        MaterialDescription: "", BaseUnitOfMeasure: "KG",
        MaterialGroup: "", PurchasingGroup: "",
        GrossWeight: 0, NetWeight: 0, WeightUnit: "KG",
        Volume: 0, VolumeUnit: "L",
        Plant: "1000", StorageLocation: "",
        MRPType: "", LotSize: "", ReorderPoint: 0, SafetyStock: 0,
        ValuationClass: "", PriceControl: "V",
        MovingAveragePrice: 0, StandardPrice: 0, Currency: "VND"
      });
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("MaterialList");
    },

    onCancel: function () {
      MessageBox.confirm("Hủy tạo vật liệu?", {
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) this.onNavBack();
        }.bind(this)
      });
    },

    onSave: function () {
      var oModel = this.getOwnerComponent().getModel("newMaterial");
      var oData  = oModel.getData();

      if (!oData.MaterialType || !oData.MaterialDescription || !oData.BaseUnitOfMeasure || !oData.MaterialGroup) {
        MessageBox.warning("Vui lòng điền đầy đủ: Loại VL, Mô tả, Đơn vị, Nhóm VL.");
        return;
      }

      var oDataModel = this.getOwnerComponent().getModel("materialData");
      var oListBinding = oDataModel.bindList("/Materials");
      oListBinding.create({
        MaterialType:        oData.MaterialType,
        MaterialTypeText:    oData.MaterialType,
        IndustrySector:      oData.IndustrySector || "M",
        MaterialDescription: oData.MaterialDescription,
        BaseUnitOfMeasure:   oData.BaseUnitOfMeasure,
        MaterialGroup:       oData.MaterialGroup,
        PurchasingGroup:     oData.PurchasingGroup || "",
        GrossWeight:         Number(oData.GrossWeight) || 0,
        NetWeight:           Number(oData.NetWeight)   || 0,
        WeightUnit:          "KG",
        Plant:               oData.Plant || "1000",
        PriceControl:        "V",
        MovingAveragePrice:  Number(oData.MovingAveragePrice) || 0,
        Currency:            oData.Currency || "VND",
        Status:              "Active"
      });

      oDataModel.submitBatch("$auto").then(function () {
        MessageToast.show("Đã tạo vật liệu thành công!");
        this.onNavBack();
      }.bind(this)).catch(function (e) {
        MessageBox.error("Lỗi: " + (e.message || e));
      });
    }
  });
});
