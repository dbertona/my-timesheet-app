codeunit 50432 "PS_ProceJobLedgerEntryMY"
{
    var
        JobLedgerEntry: Record "Job Ledger Entry";
        JobLedgerEntryYearMonth: Record "PS_JobLedgerEntryMonthYear";
        PurchInvHeader: Record "Purch. Inv. Header";
        PostingDateYear: code[4];
        PostingDateMonth: code[2];
        PurcCRHeader: Record "Purch. Cr. Memo Hdr.";

    trigger OnRun()
    var
        Dialog: Dialog;
        Total, Procesados : Integer;
    begin
        // Recorremos todos los registros de Job Ledger Entry
        JobLedgerEntryYearMonth.DeleteAll();
        Total := JobLedgerEntry.Count();
        Procesados := 0;
        Dialog.Open('Procesando líneas del diario de proyectos @1/@2', Procesados, Total);
        if JobLedgerEntry.FindSet() then
            repeat
                // Determinamos el año y el mes según la fecha disponible
                PurchInvHeader."No." := JobLedgerEntry."Document No.";
                if PurchInvHeader.GET(PurchInvHeader."No.") then begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(PurchInvHeader."VAT Reporting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(PurchInvHeader."VAT Reporting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;
                end
                else if PurcCRHeader.GET(PurcCRHeader."No.") then begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(PurcCRHeader."VAT Reporting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(PurcCRHeader."VAT Reporting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;
                end
                else begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."Posting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."Posting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;
                end;
                // Buscamos el registro en JobLedgerEntryYearMonth
                if JobLedgerEntryYearMonth.Get(JobLedgerEntry."Entry No.") then begin
                    // Actualizamos el registro existente
                    JobLedgerEntryYearMonth."PS_Year" := PostingDateYear;
                    JobLedgerEntryYearMonth."PS_Month" := PostingDateMonth;
                    JobLedgerEntryYearMonth.Modify();
                end else begin
                    // Creamos un nuevo registro si no existe
                    JobLedgerEntryYearMonth.Init();
                    JobLedgerEntryYearMonth."PS_EntryNo." := JobLedgerEntry."Entry No.";
                    JobLedgerEntryYearMonth."PS_JobNo." := JobLedgerEntry."Job No.";
                    JobLedgerEntryYearMonth."PS_Year" := PostingDateYear;
                    JobLedgerEntryYearMonth."PS_Month" := PostingDateMonth;
                    JobLedgerEntryYearMonth.Insert();
                end;
                Procesados += 1;
                Dialog.Update(1, Procesados);
            until JobLedgerEntry.Next() = 0;
        Dialog.Close();
    end;
}
