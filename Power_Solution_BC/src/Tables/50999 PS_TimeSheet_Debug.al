tableextension 50999 "PS_Debug_TimesheetLines" extends ARBVRNVeronaTimeSheetLines
{
    fields
    {
        field(90000; "PS_JobNo_Text"; Code[20])
        {
            Caption = 'Job No. Texto';
            DataClassification = ToBeClassified;
        }
    }

    trigger OnInsert()
    begin
        Message('🪵 INSERT: JobNoText="%1"  JobNo="%2"', "PS_JobNo_Text", "ARBVRNJobNo");
    end;
}
