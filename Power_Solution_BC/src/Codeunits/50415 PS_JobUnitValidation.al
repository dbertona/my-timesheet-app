codeunit 50415 "PS_JobUnitValidation"
{
    [EventSubscriber(ObjectType::Table, Database::"ARBVRNWorkCertifProductionLin", 'OnAfterValidateEvent', 'ARBVRNJobUnitNo', false, false)]
    local procedure ValidateJobUnitNo(var Rec: Record "ARBVRNWorkCertifProductionLin"; var xRec: Record "ARBVRNWorkCertifProductionLin")
    var
        JobUnitPlanningRec: Record "ARBVRNJobUnitPlanning";
        WorkCertifProductionHdrRec: Record "ARBVRNWorkCertifProductionHdr"; // Record variable for the header table
        FirstDayOfMonth: Date;
    begin
        // Obtener el registro correspondiente en ARBVRNWorkCertifProductionHdr
        if WorkCertifProductionHdrRec.Get(Rec.ARBVRNDocumentType, Rec."ARBVRNDocumentNo") then begin
            // Calcular el primer día del mes de la fecha de registro
            FirstDayOfMonth := DMY2Date(1, Date2DMY(WorkCertifProductionHdrRec."ARBVRNPostingDate", 2), Date2DMY(WorkCertifProductionHdrRec."ARBVRNPostingDate", 3));

            // Establecemos los filtros para buscar un registro en la tabla ARBVRNJobUnitPlanning
            JobUnitPlanningRec.Reset();
            JobUnitPlanningRec.SetRange(ARBVRNJobNo, Rec.ARBVRNJobNo);
            JobUnitPlanningRec.SetRange(ARBVRNJobUnitNo, Rec.ARBVRNJobUnitNo);
            JobUnitPlanningRec.SetRange(ARBVRNPlanningDate, FirstDayOfMonth);

            if not JobUnitPlanningRec.FindFirst() then
                Error('Esta unidad proyecto no está planificada para el ' +
                    Format(Date2DMY(WorkCertifProductionHdrRec."ARBVRNPostingDate", 2)) + '/' +
                    Format(Date2DMY(WorkCertifProductionHdrRec."ARBVRNPostingDate", 3)));
        end else begin
            Error('No se pudo encontrar el registro de cabecera asociado.');
        end;
    end;
}
