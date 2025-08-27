#pragma implicitwith disable
pageextension 50916 "PSARBVRNSTimeSheetLines" extends "ARBVRNSformJobTimeSheetLines"
{
    layout
    {

        modify("Job No.")
        {
            ApplicationArea = All;
            StyleExpr = ErrorStyle;
        }

        modify("Job Task No.")
        {
            ApplicationArea = All;
            StyleExpr = ErrorStyle;
        }
    }

    var
        JobRec: Record Job;
        JobTaskRec: Record "Job Task";
        ErrorStyle: Text[50];
        ErrorCheck: Codeunit "PS_ErrorTimeSheetCheckUnit";

    trigger OnAfterGetRecord()
    begin

        if Rec.ARBVRNLineNo <> 0 then begin
            ErrorCheck.CheckForErrors(Rec.ARBVRNDocumentNo, Rec.ARBVRNLineNo, ErrorStyle);
        end else begin
            Message('Rec.ARBVRNLineNo is empty for Line No.: %1', Rec.ARBVRNLineNo);
        end;
    end;
}
