using { sap.mm } from '../db/mat-schema';

service MaterialService {

  @(restrict: [
    { grant: ['READ'],                    to: ['Viewer','Admin'] },
    { grant: ['CREATE','UPDATE','DELETE'], to: ['Admin'] }
  ])
  entity Materials as projection on mm.Materials;

  @readonly
  entity MaterialStatusLog as projection on mm.MaterialStatusLog;

  action validateMaterial(
    MaterialNumber     : String,
    MaterialType       : String,
    MaterialDescription: String,
    GrossWeight        : Decimal,
    NetWeight          : Decimal,
    MovingAveragePrice : Decimal
  ) returns {
    valid    : Boolean;
    errors   : array of { field: String; message: String; };
    warnings : array of { field: String; message: String; };
  };

  action changeMaterialStatus(
    MaterialNumber: String,
    NewStatus     : String,
    ChangeReason  : String
  ) returns {
    success        : Boolean;
    message        : String;
    previousStatus : String;
  };

  action duplicateMaterial(
    MaterialNumber : String,
    NewDescription : String
  ) returns {
    success           : Boolean;
    newMaterialNumber : String;
  };

  function getMaterialStats() returns array of {
    MaterialType : String;
    Count        : Integer;
    TotalValue   : Decimal;
    AvgPrice     : Decimal;
  };

  action approveMaterial(MaterialNumber: String) returns {
    success: Boolean;
    message: String;
  };

  action rejectMaterial(MaterialNumber: String) returns {
    success: Boolean;
    message: String;
  };
}
