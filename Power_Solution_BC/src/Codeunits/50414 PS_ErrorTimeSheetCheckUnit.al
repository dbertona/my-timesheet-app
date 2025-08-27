codeunit 50414 "PS_ErrorTimeSheetCheckUnit"
{
    procedure CheckForErrors(documentNo: Code[20]; lineNo: Integer; var StyleExprError: Text[50])
    var
        recLinDoc: Record "ARBVRNVeronaTimeSheetLines";
        LineError: Boolean;
    begin
        LineError := false;
        if lineNo = 0 then begin
            recLinDoc.SetRange("ARBVRNDocumentNo", documentNo);
            if recLinDoc.FindSet() then begin
                repeat
                    VerifyErrorConditions(recLinDoc, LineError);
                until recLinDoc.Next() = 0;
            end else begin
                Message('No records found for Document No.: %1', documentNo);
            end;
        end else begin
            recLinDoc.SetRange("ARBVRNDocumentNo", documentNo);
            recLinDoc.SetRange("ARBVRNLineNo", lineNo);
            if recLinDoc.FindFirst() then begin
                VerifyErrorConditions(recLinDoc, LineError);
            end else begin
                Message('No records found for Document No.: %1, Line No.: %2', documentNo, lineNo);
            end;
        end;

        if LineError then
            StyleExprError := 'Attention'
        else
            StyleExprError := '';
    end;

    procedure VerifyErrorConditions(var recLinDoc: Record "ARBVRNVeronaTimeSheetLines"; var LineError: Boolean)
    var
        JobRec: Record Job;
        JobTaskRec: Record "Job Task";
    begin
        // Verificar condiciones específicas
        if (recLinDoc.ARBVRNWorkTypeCode <> 'VACACIONES') and (recLinDoc.ARBVRNJobTaskNo = 'VACACIONES') then
            LineError := true;
        if (recLinDoc.ARBVRNWorkTypeCode <> 'PERMISOS') and (recLinDoc.ARBVRNJobTaskNo = 'PERMISOS') then
            LineError := true;
        if (recLinDoc.ARBVRNWorkTypeCode <> 'BAJAS') and (recLinDoc.ARBVRNJobTaskNo = 'BAJAS') then
            LineError := true;
        if ((recLinDoc.ARBVRNJobTaskNo <> 'VACACIONES') and
            (recLinDoc.ARBVRNJobTaskNo <> 'PERMISOS') and
            (recLinDoc.ARBVRNJobTaskNo <> 'BAJAS')) and
             ((recLinDoc.ARBVRNWorkTypeCode = 'VACACIONES') or
                 (recLinDoc.ARBVRNWorkTypeCode = 'PERMISOS') or
                 (recLinDoc.ARBVRNWorkTypeCode = 'BAJAS')) then begin
            LineError := true;
        end;
        if JobRec.Get(recLinDoc.ARBVRNJobNo) then begin
            if JobRec.Status = JobRec.Status::Completed then
                LineError := true;
            if JobRec.Blocked = JobRec.Blocked::All then
                LineError := true;
        end;
        if JobTaskRec.Get(recLinDoc.ARBVRNJobTaskNo) then begin
            if JobTaskRec.ARBVRNTimeSheetBlocked then
                LineError := true;
        end;
    end;
}
