page 50735 "PS_TimeSheetLinesAPI"
{
    PageType = API;
    SourceTable = ARBVRNVeronaTimeSheetLines;
    APIPublisher = 'Power_Solution';
    APIGroup = 'PS_API';
    APIVersion = 'v2.0';
    EntityName = 'TimeSheetLines';
    EntitySetName = 'TimeSheetLines';

    DelayedInsert = true;
    InsertAllowed = true;
    ModifyAllowed = true;
    DeleteAllowed = false;

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field(documentNo; Rec."ARBVRNDocumentNo") { Editable = true; }
                field(lineNo; Rec."ARBVRNLineNo") { Editable = true; }
                field(resourceNo; Rec."ARBVRNResourceNo") { Editable = true; }
                field(jobTaskNo; Rec."ARBVRNJobTaskNo") { Editable = true; }
                field(description; Rec."ARBVRNExtendedDescription") { Editable = true; }
                field(timesheetDate; Rec."ARBVRNTimesheetdate") { Editable = true; }
                field(workTypeCode; Rec."ARBVRNWorktypecode") { Editable = true; }
                field(quantity; Rec."ARBVRNQuantity") { Editable = true; }
                field(unitCost; Rec."ARBVRNUnitcost") { Editable = true; }
                field(totalCost; Rec."ARBVRNTotalCost") { Editable = true; }
                field(unitPrice; Rec."ARBVRNUnitprice") { Editable = true; }
                field(salesAmount; Rec."ARBVRNSalesAmount") { Editable = true; }
                field(shortcutDimension1Code; Rec."ARBVRNShortcutDimension1Code") { Editable = true; }
                field(shortcutDimension2Code; Rec."ARBVRNShortcutDimension2Code") { Editable = true; }
                field(personResponsible; Rec."ARBVRNPersonResponsible") { Editable = true; }
                field(statusLine; Rec."ARBVRNStatusLine") { Editable = true; }
                field(jobNoText; Rec."PS_JobNo_Text")
                {
                    Caption = 'Job No. Texto';
                    Editable = true;
                }
            }
        }
    }
    trigger OnInsertRecord(BelowxRec: Boolean): Boolean
    var
        JobRec: Record Job;
    begin
        if Rec."PS_JobNo_Text" <> '' then begin
            JobRec.SetRange("No.", Rec."PS_JobNo_Text");
            if not JobRec.FindFirst() then
                Error('El proyecto "%1" no existe.', Rec."PS_JobNo_Text");

            Rec.Validate("ARBVRNJobNo", Rec."PS_JobNo_Text");
        end;

        exit(false); // permite la inserción
    end;
}
