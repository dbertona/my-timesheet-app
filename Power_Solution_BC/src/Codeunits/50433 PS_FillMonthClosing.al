codeunit 50433 "PS_FillMonthClosing"
{
    var
        PS_MonthClosing: Record "PS_MonthClosing";
        JobRec: Record "Job";
        SelectedYear: Code[4];
        MonthNames: array[12] of Text[10];
        YearAsInteger: Integer;
        i: Integer;
        ClosingDate: Date;

    trigger OnRun()
    begin
        MonthNames[1] := 'January';
        MonthNames[2] := 'February';
        MonthNames[3] := 'March';
        MonthNames[4] := 'April';
        MonthNames[5] := 'May';
        MonthNames[6] := 'June';
        MonthNames[7] := 'July';
        MonthNames[8] := 'August';
        MonthNames[9] := 'September';
        MonthNames[10] := 'October';
        MonthNames[11] := 'November';
        MonthNames[12] := 'December';

        // Request the year
        if not ConfirmYearInput(SelectedYear) then
            exit;

        // Convert the year to an integer
        if not Evaluate(YearAsInteger, SelectedYear) then
            Error('The specified year is not valid: %1.', SelectedYear);

        // Loop through the Job table and filter non-completed projects
        JobRec.SetFilter(Status, '<>%1&<>%2', JobRec.Status::Lost, JobRec.Status::Planning);
        JobRec.SetFilter("No.", '<>%1&<>%2', 'PP*', 'PY*');

        if JobRec.FindSet() then begin
            repeat
                // Generate the closing date
                if JOBREC."Starting Date" = 0D then
                    error('La fecha de inicio esta en blanco para el proyecto %1', JobRec."No.");

                // Initialize and populate the data in the table
                PS_MonthClosing.Init();
                PS_MonthClosing."PS_JobNo" := JobRec."No."; // Assign the Job No. from the project
                PS_MonthClosing."PS_Description" := JobRec.Description;
                IF Date2DMY(JOBREC."Starting Date", 3) <= YearAsInteger THEN begin
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
                    PS_MonthClosing."PS_Status" := PS_MonthClosing."PS_Status"::Close;
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
