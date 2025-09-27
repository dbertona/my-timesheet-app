#pragma implicitwith disable
pageextension 50915 "PS_ARBVRNResourceTimeSheetList" extends "ARBVRNResourceTimeSheetList"
{
    layout
    {
        modify("No.")
        {
            StyleExpr = StyleExprError;
        }
        addafter("No.")
        {
            field("Con Error"; Error)
            {
                ApplicationArea = All;
                Visible = true;
                StyleExpr = StyleExprError;
                Editable = false;
            }
        }
    }

    var
        RecLine: Record "ARBVRNPostVeronaTimeSheetLines";
        JobRec: Record Job;
        JobTaskRec: Record "Job Task";
        StyleExprError: Text[50];
        Error: boolean;
        ErrorCheck: Codeunit "PS_ErrorTimeSheetCheckUnit";

    trigger OnAfterGetRecord()
    begin

        if Rec.ARBVRNNo <> '' then begin
            ErrorCheck.CheckForErrors(Rec.ARBVRNNo, 0, StyleExprError);
        end else begin
            Message('Rec.ARBVRNNo is empty for Document No.: %1', Rec.ARBVRNNo);
        end;
    end;
}
