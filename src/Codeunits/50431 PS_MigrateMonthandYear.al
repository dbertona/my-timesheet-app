codeunit 50431 "PS_MigrateMonthandYear"
{
    trigger OnRun()
    var
        JobLedgerRec: Record "PS_JobLedgerEntryMonthYear";
    begin
        if JobLedgerRec.FindSet() then begin
            repeat
                // Mover PS_Month a PS_Month2
                if JobLedgerRec."PS_Month" <> '' then
                    JobLedgerRec."PS_Month" := FORMAT(JobLedgerRec."PS_Month");

                // Mover PS_Year a PS_Year2
                if JobLedgerRec."PS_Year" <> '' then
                    JobLedgerRec."PS_Year" := FORMAT(JobLedgerRec."PS_Year");

                JobLedgerRec.Modify();
            until JobLedgerRec.Next() = 0;

            Message('Migración completada. Los datos han sido transferidos de PS_Month/PS_Year a PS_Month2/PS_Year2.');
        end else
            Message('No se encontraron registros para migrar.');
    end;
}
