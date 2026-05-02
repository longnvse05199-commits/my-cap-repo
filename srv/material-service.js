const cds = require('@sap/cds');

module.exports = class MaterialService extends cds.ApplicationService {

  async init() {

    const { Materials, MaterialStatusLog } = this.entities;

    // Auto-set fields on CREATE
    this.before('CREATE', Materials, async (req) => {
      if (!req.data.MaterialNumber) {
        const rows = await SELECT.from(Materials).columns('MaterialNumber');
        req.data.MaterialNumber = 'MAT-' + String(rows.length + 1).padStart(6, '0');
      }
      req.data.CreatedOn = new Date().toISOString();
      req.data.CreatedBy = req.user?.id || 'SYSTEM';
      req.data.Status    = req.data.Status || 'Pending'; // Vật tư mới cần phê duyệt
      req.data.Currency  = req.data.Currency || 'VND';
    });

    // Auto-set UpdatedOn on UPDATE
    this.before('UPDATE', Materials, (req) => {
      req.data.UpdatedOn = new Date().toISOString();
      req.data.UpdatedBy = req.user?.id || 'SYSTEM';
    });

    // validateMaterial action
    this.on('validateMaterial', async (req) => {
      const { MaterialType, MaterialDescription, GrossWeight, NetWeight, MovingAveragePrice } = req.data;
      const errors = [], warnings = [];

      if (!MaterialType)
        errors.push({ field: 'MaterialType', message: 'Loại vật liệu là bắt buộc' });
      if (!MaterialDescription)
        errors.push({ field: 'MaterialDescription', message: 'Mô tả là bắt buộc' });
      if (NetWeight > GrossWeight)
        errors.push({ field: 'NetWeight', message: 'Khối lượng ròng không được vượt khối lượng đóng gói' });
      if (MovingAveragePrice < 0)
        errors.push({ field: 'MovingAveragePrice', message: 'Giá không được âm' });

      return { valid: errors.length === 0, errors, warnings };
    });

    // changeMaterialStatus action
    this.on('changeMaterialStatus', async (req) => {
      const { MaterialNumber, NewStatus, ChangeReason } = req.data;
      const material = await SELECT.one.from(Materials).where({ MaterialNumber });
      if (!material) return req.error(404, `Không tìm thấy vật liệu ${MaterialNumber}`);

      const oldStatus = material.Status;
      await UPDATE(Materials).set({ Status: NewStatus, UpdatedOn: new Date().toISOString() }).where({ MaterialNumber });

      await INSERT.into(MaterialStatusLog).entries({
        ID: cds.utils.uuid(),
        MaterialNumber,
        OldStatus: oldStatus,
        NewStatus,
        ChangeReason,
        ChangedBy: req.user?.id || 'SYSTEM',
        ChangedOn: new Date().toISOString()
      });

      return { success: true, message: `Đã đổi trạng thái từ ${oldStatus} sang ${NewStatus}`, previousStatus: oldStatus };
    });

    // duplicateMaterial action
    this.on('duplicateMaterial', async (req) => {
      const { MaterialNumber, NewDescription } = req.data;
      const original = await SELECT.one.from(Materials).where({ MaterialNumber });
      if (!original) return req.error(404, `Không tìm thấy vật liệu ${MaterialNumber}`);

      const rows = await SELECT.from(Materials).columns('MaterialNumber');
      const newNumber = 'MAT-' + String(rows.length + 1).padStart(6, '0');

      await INSERT.into(Materials).entries({
        ...original,
        MaterialNumber:      newNumber,
        MaterialDescription: NewDescription || original.MaterialDescription,
        MovingAveragePrice:  0,
        StandardPrice:       0,
        CreatedOn:           new Date().toISOString(),
        CreatedBy:           req.user?.id || 'SYSTEM',
        UpdatedOn:           null,
        UpdatedBy:           null
      });

      return { success: true, newMaterialNumber: newNumber };
    });

    // approveMaterial action
    this.on('approveMaterial', async (req) => {
      const { MaterialNumber } = req.data;
      const mat = await SELECT.one.from(Materials).where({ MaterialNumber });
      if (!mat) return req.error(404, `Không tìm thấy vật tư ${MaterialNumber}`);
      if (mat.Status !== 'Pending')
        return req.error(400, `Vật tư đang ở trạng thái "${mat.Status}", không thể phê duyệt.`);
      await UPDATE(Materials).set({ Status: 'Active', UpdatedOn: new Date().toISOString() }).where({ MaterialNumber });
      return { success: true, message: `✅ Vật tư ${MaterialNumber} đã được phê duyệt.` };
    });

    // rejectMaterial action
    this.on('rejectMaterial', async (req) => {
      const { MaterialNumber } = req.data;
      const mat = await SELECT.one.from(Materials).where({ MaterialNumber });
      if (!mat) return req.error(404, `Không tìm thấy vật tư ${MaterialNumber}`);
      if (mat.Status !== 'Pending')
        return req.error(400, `Vật tư đang ở trạng thái "${mat.Status}", không thể từ chối.`);
      await UPDATE(Materials).set({ Status: 'Rejected', UpdatedOn: new Date().toISOString() }).where({ MaterialNumber });
      return { success: true, message: `❌ Vật tư ${MaterialNumber} đã bị từ chối.` };
    });

    // getMaterialStats function
    this.on('getMaterialStats', async () => {
      const all = await SELECT.from(Materials).columns('MaterialType', 'MovingAveragePrice');
      const groups = {};
      all.forEach(m => {
        if (!groups[m.MaterialType]) groups[m.MaterialType] = { MaterialType: m.MaterialType, Count: 0, TotalValue: 0 };
        groups[m.MaterialType].Count++;
        groups[m.MaterialType].TotalValue += Number(m.MovingAveragePrice) || 0;
      });
      return Object.values(groups).map(g => ({
        ...g,
        TotalValue: Math.round(g.TotalValue),
        AvgPrice:   g.Count > 0 ? Math.round(g.TotalValue / g.Count) : 0
      }));
    });

    return super.init();
  }
};
