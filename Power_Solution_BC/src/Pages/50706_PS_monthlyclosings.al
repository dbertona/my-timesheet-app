page 50706 PS_monthlyclosings
{
    ApplicationArea = All;
    Caption = 'Monthly Closings';
    AdditionalSearchTerms = 'project Monthly Closings a';
    PageType = List;
    SourceTable = PS_MonthClosing;
    UsageCategory = Administration;
    Editable = true;

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                Caption = 'General';

                field(PS_JobNo; Rec.PS_JobNo)
                {
                    ToolTip = 'Code of the project that will be closed.';
                }
                field(Description; Rec.PS_Description)
                {
                    ToolTip = 'Description of the project that will be closed.';
                }
                field(department; Rec.PS_GlobalDimension1Code)
                {
                    ToolTip = 'Code of department the project that will be closed.';
                }
                field(PS_BudgetCode; Rec.PS_ClosingMonthCode)
                {
                    ToolTip = 'Closing code.';
                }
                field(PS_BudgetName; Rec.PS_ClosingMonthName)
                {
                    ToolTip = 'Name of the month closing.';
                }
                field(PS_BudgetDate; Rec.PS_ClosingMonthDate)
                {
                    ToolTip = 'End date of the month to close.';
                }
                field(PS_Status; Rec.PS_Status)
                {
                    ToolTip = 'Monthly closing status. The monthly closing can have two states: Closed, Open. The open state allows you to modify the monthly close, while the closed state does not allow you to modify the monthly close (or delete it).';
                    //  Editable = false;
                }
                field(PS_BillablePriceTotal; Rec.PS_BillablePriceTotal)
                {
                    ToolTip = 'Specifies the total billable price as of the closing date.';
                    Editable = false;
                }
                field(PS_CostTotal; Rec.PS_CostTotal)
                {
                    ToolTip = 'Specifies the total cost as of the closing date.';
                    Editable = false;
                }
                field(PS_Month; Rec.PS_Month)
                {
                    Editable = true;
                    Visible = false;
                }
                field(PS_Year; Rec.PS_Year)
                {
                    Editable = true;
                    Visible = false;
                }
                field(Estado; Rec."Job Status")
                {
                    Editable = true;
                    Visible = true;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            group("Job")
            {
                action("Close")
                {
                    Promoted = true;
                    PromotedCategory = Process;
                    ApplicationArea = All;
                    Image = Close;
                    Caption = 'Close';
                    PromotedOnly = true;
                    trigger OnAction()
                    var
                        TempSelectedRecords: Record "PS_MonthClosing";
                        Helper: Codeunit "PS_MonthlyClosingHelper"; // Codeunit donde movimos la lógica
                    begin
                        CurrPage.SetSelectionFilter(TempSelectedRecords);
                        Helper.CerrarProyectosMes(TempSelectedRecords);
                    end;
                }
                action("Create monthly year closings")
                {
                    Promoted = true;
                    PromotedCategory = Process;
                    ApplicationArea = All;
                    Image = Add;
                    PromotedOnly = true;
                    Caption = 'Create monthly year closings';
                    trigger OnAction()
                    begin
                        FillMonthClosing(); // Llama al procedimiento definido en la página
                    end;
                }
            }
        }
    }

    var
        JobRec: Record "Job";

    trigger OnAfterGetRecord()
    begin
        if not JobRec.Get(rec.PS_JobNo) then
            Clear(JobRec);

    end;

    trigger OnOpenPage()
    begin
        // Filtro para excluir los proyectos que empiezan por "PP" o "PY"
        Rec.FilterGroup(2);
        Rec.SetFilter(PS_JobNo, '<>%1', 'PY*');
        Rec.FilterGroup(0);
        Rec.SetFilter(PS_Status, 'Open');
        Rec.SetFilter("Job Status", 'Planning|Quote|Open');
        Rec.SetFilter(PS_Year, format(Date2DMY(Today, 3)));
    end;

    procedure FillMonthClosing()
    var
        PS_MonthClosing: Record "PS_MonthClosing";
        JobRec: Record "Job";
        SelectedYear: Code[4];
        MonthNames: array[12] of Text[10];
        YearAsInteger: Integer;
        i: Integer;
        ClosingDate: Date;
    begin
        MonthNames[1] := 'Enero';
        MonthNames[2] := 'Febrero';
        MonthNames[3] := 'Marzo';
        MonthNames[4] := 'Abril';
        MonthNames[5] := 'Mayo';
        MonthNames[6] := 'Junio';
        MonthNames[7] := 'Julio';
        MonthNames[8] := 'Agosto';
        MonthNames[9] := 'Septiembre';
        MonthNames[10] := 'Octubre';
        MonthNames[11] := 'Noviembre';
        MonthNames[12] := 'Diciembre';

        // Request the year
        if not ConfirmYearInput(SelectedYear) then
            exit;

        // Convert the year to an integer
        if not Evaluate(YearAsInteger, SelectedYear) then
            Error('The specified year is not valid: %1.', SelectedYear);

        // Loop through the Job table and filter non-completed projects
        JobRec.SetFilter(Status, '<>%1&<>%2', JobRec.Status::Completed, JobRec.Status::Lost);
        JobRec.SetFilter("No.", '<>%1', 'PY*');
        if JobRec.FindSet() then begin
            repeat
                // Validar que el proyecto NO tenga marcado "Imputación por desglose"
                if JobRec."ARBVRNAllocationBreakdown" then begin
                    Message('El proyecto %1 tiene marcado "Imputación por desglose" y no se crearán períodos de cierre.', JobRec."No.");
                    JobRec.Next();
                    continue;
                end;
                
                for i := 1 to 12 do begin
                    PS_MonthClosing.Init();
                    PS_MonthClosing."PS_JobNo" := JobRec."No."; // Assign the Job No. from the project
                    PS_MonthClosing."PS_Description" := JobRec.Description;
                    IF i > 9 THEN begin
                        PS_MonthClosing.PS_ClosingMonthCode := Format(YearAsInteger) + '.' + Format(i);
                        PS_MonthClosing.SetRange(PS_MonthClosing."PS_ClosingMonthCode", Format(YearAsInteger) + '.' + Format(i));
                    end
                    ELSE begin
                        PS_MonthClosing.SetRange(PS_MonthClosing."PS_ClosingMonthCode", Format(YearAsInteger) + '.0' + Format(i));
                        PS_MonthClosing.PS_ClosingMonthCode := Format(YearAsInteger) + '.0' + Format(i);
                    end;
                    PS_MonthClosing.PS_GlobalDimension1Code := JobRec."Global Dimension 1 Code";
                    PS_MonthClosing."PS_ClosingMonthName" := MonthNames[i];
                    PS_MonthClosing."PS_Status" := PS_MonthClosing."PS_Status"::Open;
                    PS_MonthClosing.PS_Month := Format(i);
                    PS_MonthClosing."PS_Year" := Format(YearAsInteger); // Convert year to text
                    Evaluate(ClosingDate, '01/' + PS_MonthClosing.PS_Month + '/' + PS_MonthClosing.PS_Year);
                    PS_MonthClosing.PS_ClosingMonthDate := CalcDate('<CM>', ClosingDate);
                    PS_MonthClosing.SetRange(PS_MonthClosing."PS_JobNo", JobRec."No.");
                    if not PS_MonthClosing.FindFirst() then
                        PS_MonthClosing.Insert();
                end;
            until JobRec.Next() = 0;
        end;

        Message('Records have been created for all projects in the year %1.', SelectedYear);
    end;

    local procedure ConfirmYearInput(var SelectedYear: Code[4]): Boolean
    var
        SelectedOption: Integer;
        CurrentYear: Integer;
        YearList: Text;
    begin
        CurrentYear := Date2DMY(Today(), 3);
        YearList := Format(CurrentYear) + ',' + Format(CurrentYear + 1) + ',' + Format(CurrentYear + 2);

        SelectedOption := StrMenu(YearList, 1);
        if SelectedOption = 0 then
            exit(false);

        SelectedYear := CopyStr(YearList, (SelectedOption - 1) * 5 + 1, 4);
        exit(true);
    end;
}
