page 50735 "PS InsertLine API"
{
    PageType = API;
    SourceTable = "PS API Insert TimeSheet";
    APIPublisher = 'powersolution';
    APIGroup = 'timesheet';
    APIVersion = 'v1.0';
    EntityName = 'insertline';
    EntitySetName = 'insertlines';
    DelayedInsert = true;

    layout
    {
        area(content)
        {
            repeater(group)
            {
                field("DocumentNo"; Rec."Document No.") { }
                field("LineNo"; Rec."Line No.") { }
                field("ResourceNo"; Rec."Resource No.") { }
                field("JobNo"; Rec."Job No.") { }
                field("JobTaskNo"; Rec."Job Task No.") { }
                field(Description; Rec.Description) { }
                field("TimesheetDate"; Rec."Timesheet Date") { }
                field(Quantity; Rec.Quantity) { }
                field("WorkTypeCode"; Rec."Work Type Code") { }
            }
        }
    }

    trigger OnInsertRecord(BelowxRec: Boolean): Boolean
    var
        MyHandler: Codeunit "PS_InsertTimeSheetLineAPI";
    begin
        MyHandler.InsertLine(
            Rec."Document No.",
            Rec."Line No.",
            Rec."Resource No.",
            Rec."Job No.",
            Rec."Job Task No.",
            Rec.Description,
            Rec."Timesheet Date",
            Rec.Quantity,
            Rec."Work Type Code"
        );
        exit(false);
    end;
}
