codeunit 50430 "PS_PopulateProjResHours"
{
    Subtype = Normal;

    trigger OnRun()
    var
        JobLedgerEntry: Record "Job Ledger Entry";
        ProjectResourceHours: Record "PSProjectResourceHours";
        PSProjectTaskResourceHours: Record "PS_ProjectTaskResourceHours";
        MonthClosing: Record "PS_MonthClosing";
        OpenMonth: Code[2];
        OpenYear: Code[4];
    begin
        // Elimina todos los registros existentes en Project Resource Hours
        ProjectResourceHours.DeleteAll();

        // Filtrar para obtener solo registros de tipo recurso que serán utilizados en Project Resource Hours
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Type"::Resource);
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
        JobLedgerEntry.SetRange("ARBVRNComputedForHours", true);

        // Recorre los registros de Job Ledger Entry
        if JobLedgerEntry.FindSet() then
            repeat
                // Buscar el primer mes abierto para el proyecto actual
                MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Open);

                if MonthClosing.FindSet() then begin
                    // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                    ProjectResourceHours.SetRange("PS_Job No.", JobLedgerEntry."Job No.");
                    ProjectResourceHours.SetRange("PS_Resource No.", JobLedgerEntry."No.");

                    if not ProjectResourceHours.FindFirst() then begin
                        // Si no existe, crear un nuevo registro
                        ProjectResourceHours.Init();
                        ProjectResourceHours."PS_Job No." := JobLedgerEntry."Job No.";
                        ProjectResourceHours."PS_Resource No." := JobLedgerEntry."No.";
                        ProjectResourceHours."PS_Month" := MonthClosing.PS_Month;
                        ProjectResourceHours."PS_Year" := MonthClosing.PS_Year;
                        ProjectResourceHours.Insert();
                    end;
                end
                else begin
                    MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                    MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Close);

                    if MonthClosing.FindLast() then begin
                        // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                        ProjectResourceHours.SetRange("PS_Job No.", JobLedgerEntry."Job No.");
                        ProjectResourceHours.SetRange("PS_Resource No.", JobLedgerEntry."No.");

                        if not ProjectResourceHours.FindFirst() then begin
                            // Si no existe, crear un nuevo registro
                            ProjectResourceHours.Init();
                            ProjectResourceHours."PS_Job No." := JobLedgerEntry."Job No.";
                            ProjectResourceHours."PS_Resource No." := JobLedgerEntry."No.";
                            ProjectResourceHours."PS_Month" := MonthClosing.PS_Month;
                            ProjectResourceHours."PS_Year" := MonthClosing.PS_Year;
                            ProjectResourceHours.Insert();
                        end;
                    end;
                end;
                ProjectResourceHours.Reset(); // Restablecer el rango para el siguiente registro
            until JobLedgerEntry.Next() = 0;

        PSProjectTaskResourceHours.DeleteAll();

        // Filtrar para obtener solo registros de tipo recurso que serán utilizados en Project Resource Hours
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Type"::Resource);
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
        JobLedgerEntry.SetRange("ARBVRNComputedForHours", true);

        // Recorre los registros de Job Ledger Entry
        if JobLedgerEntry.FindSet() then
            repeat
                // Buscar el primer mes abierto para el proyecto actual
                MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Open);

                if MonthClosing.FindSet() then begin
                    // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                    PSProjectTaskResourceHours.SetRange("PS_JobNo.", JobLedgerEntry."Job No.");
                    PSProjectTaskResourceHours.SetRange("PS_ResourceNo.", JobLedgerEntry."No.");
                    PSProjectTaskResourceHours.SetRange("PS_JobTaskNo.", JobLedgerEntry."Job Task No.");
                    if not PSProjectTaskResourceHours.FindFirst() then begin
                        // Si no existe, crear un nuevo registro
                        PSProjectTaskResourceHours.Init();
                        PSProjectTaskResourceHours."PS_JobNo." := JobLedgerEntry."Job No.";
                        PSProjectTaskResourceHours."PS_ResourceNo." := JobLedgerEntry."No.";
                        PSProjectTaskResourceHours."PS_Month" := MonthClosing.PS_Month;
                        PSProjectTaskResourceHours."PS_Year" := MonthClosing.PS_Year;
                        PSProjectTaskResourceHours."PS_JobTaskNo." := JobLedgerEntry."Job Task No.";
                        PSProjectTaskResourceHours.Insert();
                    end;

                    PSProjectTaskResourceHours.Reset(); // Restablecer el rango para el siguiente registro
                end;
            until JobLedgerEntry.Next() = 0;

        // Mensaje de confirmación
        Message('La tabla Project Resource Hours se ha poblado con los registros de Job Ledger Entry y sus respectivos meses abiertos.');
    end;
}
