codeunit 50413 "PS_ARBVRNTimeSheetValidation"
{
    [EventSubscriber(ObjectType::Codeunit, Codeunit::"ARBVRNPostVeronaTimeSheet", 'OnBeforePostParteDoc', '', false, false)]
    local procedure OnBeforePostParteDoc(var VeronaTimesheetHeader: Record "ARBVRNVeronaTimesheetHeader")
    var
        JobRec: Record Job;
        JobTaskRec: Record "Job Task";
        TimeSheetLine: Record "ARBVRNVeronaTimeSheetLines";
        ErrorCheck: Codeunit "PS_ErrorTimeSheetCheckUnit";
        LineError: Boolean;
    begin
        LineError := false;


        TimeSheetLine.SetRange("ARBVRNDocumentNo", VeronaTimesheetHeader."ARBVRNNo");


        if TimeSheetLine.FindSet() then begin
            // Mostrar los registros después de aplicar el filtro
            repeat
                // Verifica las condiciones de error para cada línea
                ErrorCheck.VerifyErrorConditions(TimeSheetLine, LineError);
                if LineError then begin
                    Error('No se puede registrar debido a errores en las línea Nº ' + Format(TimeSheetLine.ARBVRNLineNo) + ' del parte de horas ' + Format(VeronaTimesheetHeader."ARBVRNNo"));
                    exit; // Detener el proceso si se encuentra un error
                end;
            until TimeSheetLine.Next() = 0;
        end else begin
            // Maneja el caso en que no se encuentran registros
            Error('No se encontraron líneas para el documento No.: %1', VeronaTimesheetHeader."ARBVRNNo");
        end;
    end;
}
