tableextension 51001 "PS project Ledger Entry" extends "Job Ledger Entry"
{
    fields
    {
        field(50100; PS_Month; Code[2])
        {
            Caption = 'Month';
            FieldClass = FlowField;
            CalcFormula = Lookup(PS_JobLedgerEntryMonthYear.PS_Month WHERE("PS_EntryNo." = FIELD("Entry No.")));
        }
        field(50101; PS_Year; Code[4])
        {
            Caption = 'Year';
            FieldClass = FlowField;
            CalcFormula = Lookup(PS_JobLedgerEntryMonthYear.PS_Year WHERE("PS_EntryNo." = FIELD("Entry No.")));
        }
    }

    trigger OnAfterInsert()
    var
        JobLedgerEntry: Record "Job Ledger Entry";
        JobLedgerEntryYearMonth: Record "PS_JobLedgerEntryMonthYear";
        DocumentDate: Text[10];
        PostingDateYear: Code[4];
        PostingDateMonth: Code[2];
        ProjectResourceHours: Record "PSProjectResourceHours";
    begin
        JobLedgerEntry.Get(Rec."Entry No.");
        ProjectResourceHours.SetRange("PS_Job No.", "Job No.");
        ProjectResourceHours.SetRange("PS_Resource No.", "No.");
        if not ProjectResourceHours.FindFirst() then begin
            ProjectResourceHours.Init();
            ProjectResourceHours."PS_Job No." := "Job No.";
            ProjectResourceHours."PS_Resource No." := "No.";
            ProjectResourceHours.Insert();
        end;
        JobLedgerEntryYearMonth."PS_EntryNo." := JobLedgerEntry."Entry No.";
        JobLedgerEntryYearMonth."PS_JobNo." := JobLedgerEntry."Job No.";
        if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
            PostingDateYear := format(Date2DMY(JobLedgerEntry."Posting Date", 3)); // Año
            PostingDateMonth := format(Date2DMY(JobLedgerEntry."Posting Date", 2)); // Mes
        end else begin
            PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
            PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
        end;
        JobLedgerEntryYearMonth."PS_Year" := PostingDateYear;
        JobLedgerEntryYearMonth."PS_Month" := PostingDateMonth;
        JobLedgerEntryYearMonth.Insert();
    end;

    trigger OnModify()
    var
        JobLedgerEntryMonthYear: Record "PS_JobLedgerEntryMonthYear";
    begin
        // Busca el registro en PS_JobLedgerEntryMonthYear relacionado
        if JobLedgerEntryMonthYear.Get(Rec."Entry No.") then begin

            if rec."ARBVRNTimesheetdate" = 0D then begin
                JobLedgerEntryMonthYear.PS_Year := format(Date2DMY(rec."Posting Date", 3)); // Año
                JobLedgerEntryMonthYear.PS_Month := format(Date2DMY(rec."Posting Date", 2)); // Mes
            end else begin
                JobLedgerEntryMonthYear.PS_Year := format(Date2DMY(rec."ARBVRNTimesheetdate", 3)); // Año
                JobLedgerEntryMonthYear.PS_Month := format(Date2DMY(rec."ARBVRNTimesheetdate", 2)); // Mes
            end;
            JobLedgerEntryMonthYear.Modify();
        end;
    end;
}
