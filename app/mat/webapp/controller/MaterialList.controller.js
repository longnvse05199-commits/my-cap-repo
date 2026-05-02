sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/mm/material/model/formatter"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, formatter) {
  "use strict";

  return Controller.extend("sap.mm.material.controller.MaterialList", {
    formatter: formatter,

    onInit: function () {
      this._searchQuery = "";
      this._typeFilter  = "";
      // Refresh table mỗi khi quay lại trang này (sau khi đổi trạng thái, xóa, v.v.)
      this.getOwnerComponent().getRouter()
        .getRoute("MaterialList").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      var oBinding = this.byId("materialTable") && this.byId("materialTable").getBinding("items");
      if (oBinding) oBinding.refresh();
    },

    onCreateMaterial: function () {
      this.getOwnerComponent().getRouter().navTo("CreateMaterial");
    },

    onNavToLaunchpad: function () {
      window.location.href = "../../launchpad/index.html";
    },

    onNavToLaunchpad: function () {
      window.location.href = "../../launchpad/index.html";
    },

    onSearch: function (oEvent) {
      this._searchQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
      this._applyFilters();
    },

    onFilterType: function (oEvent) {
      this._typeFilter = oEvent.getParameter("selectedItem").getKey();
      this._applyFilters();
    },

    _applyFilters: function () {
      var aFilters = [];
      if (this._searchQuery) {
        aFilters.push(new Filter({
          filters: [
            new Filter("MaterialNumber",      FilterOperator.Contains, this._searchQuery),
            new Filter("MaterialDescription", FilterOperator.Contains, this._searchQuery)
          ],
          and: false
        }));
      }
      if (this._typeFilter) {
        aFilters.push(new Filter("MaterialType", FilterOperator.EQ, this._typeFilter));
      }
      this.byId("materialTable").getBinding("items")
        .filter(aFilters.length ? new Filter({ filters: aFilters, and: true }) : []);
    },

    onMaterialPress: function (oEvent) {
      var oSource  = oEvent.getSource();
      var oContext = oSource.getBindingContext("materialData");
      if (!oContext) {
        var oItem = oSource.getParent();
        oContext  = oItem && oItem.getBindingContext("materialData");
      }
      if (!oContext) return;

      var oData = oContext.getObject();
      this.getOwnerComponent().setModel(
        new sap.ui.model.json.JSONModel(oData), "detailModel"
      );
      this.getOwnerComponent().getRouter().navTo("MaterialDetail", {
        materialId: encodeURIComponent(oData.MaterialNumber)
      });
    },

    onRefresh: function () {
      this.byId("materialTable").getBinding("items").refresh();
      MessageToast.show("Đã làm mới danh sách");
    },

    onShowStats: function () {
      var oModel     = this.getOwnerComponent().getModel("materialData");
      var oOperation = oModel.bindContext("/getMaterialStats(...)");
      oOperation.execute().then(function () {
        var aStats = oOperation.getBoundContext().getObject().value || [];
        var sMsg   = aStats.map(function (s) {
          return s.MaterialType + ": " + s.Count + " vật liệu, giá TB " +
            new Intl.NumberFormat("vi-VN").format(s.AvgPrice) + " VND";
        }).join("\n");
        MessageBox.information(sMsg || "Không có dữ liệu", { title: "Thống Kê" });
      }).catch(function (e) {
        MessageBox.error("Lỗi: " + (e.message || e));
      });
    }
  });
});
