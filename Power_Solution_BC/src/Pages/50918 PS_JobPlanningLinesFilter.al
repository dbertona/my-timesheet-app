pageextension 50918 "PS_JobPlanningLinesFilter" extends "Job Planning Lines Part"
{
    layout
    {
        modify("Planning Date")
        {
            Editable = LineEditable;
        }
        modify("Line Type")
        {
            Editable = LineEditable;
            OptionCaption = 'Budget, Billable';
        }
        modify("Type")
        {
            Editable = LineEditable;
        }
        modify("No.")
        {
            Editable = LineEditable;
        }
        modify("Document No.")
        {
            Editable = LineEditable;
        }
        modify("Description")
        {
            Editable = LineEditable;
        }
        modify("Quantity")
        {
            Editable = LineEditable;
        }
        modify("Direct Unit Cost (LCY)")
        {
            Editable = LineEditable;
        }
        modify("Unit Price")
        {
            Editable = LineEditable;
        }
        modify("Total Price")
        {
            Editable = LineEditable;
        }
        modify("Line Amount (LCY)")
        {
            Editable = LineEditable;
        }
        modify("Line Amount")
        {
            Editable = LineEditable;
        }
        modify("Unit Cost")
        {
            Editable = LineEditable;
        }
        modify("Qty. to Assemble")
        {
            Editable = False;
            Visible = False;
        }

        modify("Invoiced Amount (LCY)")
        {
            Editable = False;
            Visible = False;
        }
        modify("Qty. to Transfer to Journal")
        {
            Editable = False;
            Visible = False;
        }

        modify("Planned Delivery Date")
        {
            Editable = False;
            Visible = False;
        }
        modify("Job Task No.")
        {
            Editable = False;
        }


    }
    var
        MonthClosing: Record "PS_MonthClosing";
        FirstOfMonth: Date;
        MonthInt: Integer;
        YearInt: Integer;
        FilterApplied: Boolean;
        LineEditable: Boolean;

    trigger OnAfterGetRecord();
    begin
        // Solo aplica el filtro si no se ha hecho antes
        if not FilterApplied then begin
            MonthClosing.SetRange(PS_JobNo, Rec."Job No.");
            MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Open);

            if MonthClosing.FindSet() then begin
                if FirstOfMonth = 0D then begin
                    Evaluate(MonthInt, MonthClosing.PS_Month);
                    Evaluate(YearInt, MonthClosing.PS_Year);
                    FirstOfMonth := DMY2Date(1, MonthInt, YearInt);
                    Rec.SetCurrentKey("Job No.", "Job Task No.", "Schedule Line", "Planning Date");
                    Rec.SetFilter("Planning Date", '>=%1', FirstOfMonth);
                    Rec.SetAscending("Schedule Line", true);
                    FilterApplied := true;
                end;
            end;
        end;
        LineEditable := IsLineEditable();
        PlanningDateEditable := LineEditable;
    end;

    local procedure IsLineEditable(): Boolean;
    begin
        // Verificar si la línea pertenece a un mes cerrado
        MonthClosing.SetRange(PS_JobNo, Rec."Job No.");
        MonthClosing.SetRange(PS_ClosingMonthCode, FORMAT(Rec."Planning Date", 0, '<Year4>.<Month,2>'));
        MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Close);

        // Si el mes está cerrado, la línea no es editable
        if MonthClosing.FindFirst() then
            exit(false);

        // En caso contrario, la línea es editable
        exit(true);
    end;

    trigger OnNewRecord(BelowxRec: Boolean)
    begin
        rec."Planning Date" := Today();
    end;

}
