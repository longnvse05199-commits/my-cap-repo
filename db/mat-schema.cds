namespace sap.mm;

entity Materials {
  key MaterialNumber     : String(18);
  MaterialType           : String(4);
  MaterialTypeText       : String(60);
  IndustrySector         : String(2);
  MaterialDescription    : String(80);
  BaseUnitOfMeasure      : String(3);
  MaterialGroup          : String(8);
  PurchasingGroup        : String(3);
  GrossWeight            : Decimal(13,3);
  NetWeight              : Decimal(13,3);
  WeightUnit             : String(3);
  Volume                 : Decimal(13,3);
  VolumeUnit             : String(3);
  Plant                  : String(4);
  StorageLocation        : String(4);
  MRPType                : String(2);
  LotSize                : String(3);
  ReorderPoint           : Decimal(13,3);
  SafetyStock            : Decimal(13,3);
  ValuationClass         : String(4);
  PriceControl           : String(1);
  MovingAveragePrice     : Decimal(13,2);
  StandardPrice          : Decimal(13,2);
  Currency               : String(3);
  Status                 : String(20);
  CreatedOn              : DateTime;
  CreatedBy              : String(40);
  UpdatedOn              : DateTime;
  UpdatedBy              : String(40);
}

entity MaterialStatusLog {
  key ID             : UUID;
  MaterialNumber     : String(18);
  OldStatus          : String(20);
  NewStatus          : String(20);
  ChangeReason       : String(200);
  ChangedBy          : String(40);
  ChangedOn          : DateTime;
}
