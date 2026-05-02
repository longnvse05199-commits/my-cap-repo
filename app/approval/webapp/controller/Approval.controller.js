sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.company.approval.controller.Approval", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        empCount:   "",
        leaveCount: "",
        matCount:   ""
      }), "approvalState");
    },

    // ── Count badges ──────────────────────────────────────────
    onEmpUpdateFinished: function (oEvent) {
      this.getView().getModel("approvalState")
        .setProperty("/empCount", String(oEvent.getParameter("total") || 0));
    },
    onLeaveUpdateFinished: function (oEvent) {
      this.getView().getModel("approvalState")
        .setProperty("/leaveCount", String(oEvent.getParameter("total") || 0));
    },
    onMatUpdateFinished: function (oEvent) {
      this.getView().getModel("approvalState")
        .setProperty("/matCount", String(oEvent.getParameter("total") || 0));
    },

    // ── Approve / Reject Employee ─────────────────────────────
    onApproveEmployee: function (oEvent) {
      var oCtx  = oEvent.getSource().getBindingContext("empData");
      var sId   = oCtx.getProperty("ID");
      var sName = oCtx.getProperty("firstName") + " " + oCtx.getProperty("lastName");
      MessageBox.confirm("Phê duyệt nhân viên: " + sName + "?", {
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._empAction("approveEmployee", { employeeId: sId },
            "✅ Đã phê duyệt " + sName, this.onRefreshEmployees);
        }.bind(this)
      });
    },

    onRejectEmployee: function (oEvent) {
      var oCtx  = oEvent.getSource().getBindingContext("empData");
      var sId   = oCtx.getProperty("ID");
      var sName = oCtx.getProperty("firstName") + " " + oCtx.getProperty("lastName");
      MessageBox.confirm("Từ chối nhân viên: " + sName + "?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._empAction("rejectEmployee", { employeeId: sId },
            "❌ Đã từ chối " + sName, this.onRefreshEmployees);
        }.bind(this)
      });
    },

    // ── Approve / Reject Leave ────────────────────────────────
    onApproveLeave: function (oEvent) {
      var oCtx  = oEvent.getSource().getBindingContext("empData");
      var sId   = oCtx.getProperty("ID");
      var sName = (oCtx.getProperty("employee/firstName") || "") + " " +
                  (oCtx.getProperty("employee/lastName")  || "");
      MessageBox.confirm("Duyệt đơn nghỉ phép của " + sName.trim() + "?", {
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._empAction("approveLeaveRequest", { leaveRequestId: sId },
            "✅ Đã duyệt đơn nghỉ phép", this.onRefreshLeave);
        }.bind(this)
      });
    },

    onRejectLeave: function (oEvent) {
      var oCtx  = oEvent.getSource().getBindingContext("empData");
      var sId   = oCtx.getProperty("ID");
      var sName = (oCtx.getProperty("employee/firstName") || "") + " " +
                  (oCtx.getProperty("employee/lastName")  || "");
      MessageBox.confirm("Từ chối đơn nghỉ phép của " + sName.trim() + "?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._empAction("rejectLeaveRequest", { leaveRequestId: sId },
            "❌ Đã từ chối đơn nghỉ phép", this.onRefreshLeave);
        }.bind(this)
      });
    },

    // ── Approve / Reject Material ─────────────────────────────
    onApproveMaterial: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("matData");
      var sNum = oCtx.getProperty("MaterialNumber");
      MessageBox.confirm("Phê duyệt vật tư: " + sNum + "?", {
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._matAction("approveMaterial", { MaterialNumber: sNum },
            "✅ Đã phê duyệt " + sNum, this.onRefreshMaterial);
        }.bind(this)
      });
    },

    onRejectMaterial: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext("matData");
      var sNum = oCtx.getProperty("MaterialNumber");
      MessageBox.confirm("Từ chối vật tư: " + sNum + "?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._matAction("rejectMaterial", { MaterialNumber: sNum },
            "❌ Đã từ chối " + sNum, this.onRefreshMaterial);
        }.bind(this)
      });
    },

    // ── Internal action helpers ───────────────────────────────
    _empAction: function (sAction, oParams, sMsg, fnRefresh) {
      var oModel = this.getView().getModel("empData");
      var oOp    = oModel.bindContext("/" + sAction + "(...)");
      Object.entries(oParams).forEach(function (e) { oOp.setParameter(e[0], e[1]); });
      oOp.execute().then(function () {
        MessageToast.show(sMsg);
        if (fnRefresh) fnRefresh.call(this);
      }.bind(this)).catch(function (e) { MessageBox.error(e.message || String(e)); });
    },

    _matAction: function (sAction, oParams, sMsg, fnRefresh) {
      var oModel = this.getView().getModel("matData");
      var oOp    = oModel.bindContext("/" + sAction + "(...)");
      Object.entries(oParams).forEach(function (e) { oOp.setParameter(e[0], e[1]); });
      oOp.execute().then(function () {
        MessageToast.show(sMsg);
        if (fnRefresh) fnRefresh.call(this);
      }.bind(this)).catch(function (e) { MessageBox.error(e.message || String(e)); });
    },

    // ── Refresh ───────────────────────────────────────────────
    onRefreshAll: function () {
      this.onRefreshEmployees();
      this.onRefreshLeave();
      this.onRefreshMaterial();
      MessageToast.show("Đã làm mới tất cả.");
    },
    onRefreshEmployees: function () {
      var oB = this.byId("empTable").getBinding("items");
      if (oB) oB.refresh();
    },
    onRefreshLeave: function () {
      var oB = this.byId("leaveTable").getBinding("items");
      if (oB) oB.refresh();
    },
    onRefreshMaterial: function () {
      var oB = this.byId("matTable").getBinding("items");
      if (oB) oB.refresh();
    },

    // ── Formatter ─────────────────────────────────────────────
    formatDateRange: function (sStart, sEnd) {
      if (!sStart || !sEnd) return "—";
      var fmt = function (s) {
        var p = s.split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s;
      };
      return fmt(sStart) + " → " + fmt(sEnd);
    },

    // ── Navigation ────────────────────────────────────────────
    onNavToLaunchpad: function () {
      window.location.href = "../../launchpad/index.html";
    }
  });
});
