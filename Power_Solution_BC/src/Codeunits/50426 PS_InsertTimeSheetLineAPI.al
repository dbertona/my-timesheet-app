codeunit 50426 "PS_InsertTimeSheetLineAPI"
{
    procedure InsertLine(
        documentNo: Code[20];
        lineNo: Integer;
        resourceNo: Code[20];
        jobNoText: Code[20];
        jobTaskNo: Code[20];
        description: Text[100];
        timesheetDate: Date;
        quantity: Decimal;
        workTypeCode: Code[10] // <-- nuevo parámetro
    )
    var
        TimeSheetLine: Record "ARBVRNVeronaTimeSheetLines";
        JobRec: Record Job;
        ResourceRec: Record Resource;
        ResourceCost: Record "Resource Cost";
        trace: Text;
        unitCost: Decimal;
    begin
        trace := '🚀 Iniciando InsertLine… ';

        // Validar proyecto si se informa
        if jobNoText <> '' then begin
            trace += '🔍 Validando proyecto "' + jobNoText + '"… ';
            JobRec.SetRange("No.", jobNoText);
            if not JobRec.FindFirst() then
                Error('❌ El proyecto "%1" no existe.', jobNoText);
            trace += '✅ Proyecto válido. ';
        end else
            trace += '⚠️ jobNoText vacío. ';

        // Buscar Unit Cost desde tabla Resource Cost
        ResourceCost.SetRange(Type, ResourceCost.Type::Resource);
        ResourceCost.SetRange(Code, resourceNo);
        ResourceCost.SetRange("Work Type Code", workTypeCode);

        if ResourceCost.FindFirst() then begin
            unitCost := ResourceCost."Unit Cost";
            trace += StrSubstNo('💰 Coste desde Resource Cost para %1/%2: %3. ', resourceNo, workTypeCode, Format(unitCost));
        end else begin
            // Fallback: obtener de ficha del recurso
            if ResourceRec.Get(resourceNo) then begin
                unitCost := ResourceRec."Unit Cost";
                trace += StrSubstNo('⚠️ No se encontró tarifa en Resource Cost. Se usa coste estándar %1: %2. ', resourceNo, Format(unitCost));
            end else begin
                unitCost := 0;
                trace += '❌ Recurso no encontrado. Coste = 0. ';
            end;
        end;

        // Insertar línea
        trace += '📝 Insertando línea… ';
        TimeSheetLine.Init();
        TimeSheetLine."ARBVRNDocumentNo" := documentNo;
        TimeSheetLine."ARBVRNLineNo" := lineNo;
        TimeSheetLine."ARBVRNResourceNo" := resourceNo;
        TimeSheetLine."ARBVRNJobNo" := jobNoText;
        TimeSheetLine."ARBVRNJobTaskNo" := jobTaskNo;
        TimeSheetLine."ARBVRNExtendedDescription" := description;
        TimeSheetLine."ARBVRNTimesheetdate" := timesheetDate;
        TimeSheetLine."ARBVRNQuantity" := quantity;
        TimeSheetLine."ARBVRNWorktypecode" := workTypeCode;
        TimeSheetLine."ARBVRNUnitCost" := unitCost;
        TimeSheetLine."ARBVRNTotalCost" := unitCost * quantity;
        TimeSheetLine.Insert();

        trace += '✅ Linea insertada correctamente.';
        Message(trace);
    end;
}
