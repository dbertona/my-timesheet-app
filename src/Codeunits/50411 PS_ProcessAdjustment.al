codeunit 50411 "PS_ProcessAdjustment"
{
    procedure ProcesarAjuste(PostingDate: Date)
    var
        JobLedgerGroupedRec: Record "PS_Temp Grouped job Ledger";
        JobLedgerSummaryRec: Record "PS_Temp job Ledger Summary";
        GenJnlLine: Record "Gen. Journal Line";
        GenJnlTemplate: Record "Gen. Journal Template";
        GenJnlBatch: Record "Gen. Journal Batch";
        ResourceRec: Record Resource;
        JobRec: Record Job;
        //PostingDate: Date;
        LineNo: Integer;

        RecordCount: Integer;
        DeptCodeSuffix: Text[2];
        TotalRedondeo: Decimal;
        Progress: Dialog;
        ProgressMsg: Label 'Procesando.......#1######################\';
        Counter: Integer;
        OpenProject: Boolean;
        UnblockProject: Boolean;
        JobNo: Code[20];
        OpenedJobs: Record PS_ReOpenProject;

    begin
        OpenedJobs.DeleteAll();
        if not GenJnlTemplate.Get('PROYECTOS') then
            Error('La plantilla del diario general "PROYECTOS" no existe.');
        if not GenJnlBatch.Get('PROYECTOS', 'DESVIACION') then
            Error('El lote del diario general "DESVIACION" no existe.');

        if GenJnlBatch.Get('PROYECTOS', 'DESVIACION') then begin
            GenJnlLine.SetRange("Journal Template Name", GenJnlBatch."Journal Template Name");
            GenJnlLine.SetRange("Journal Batch Name", GenJnlBatch.Name);
            if GenJnlLine.FindSet() then begin
                GenJnlLine.DeleteAll();
            end;
        end;

        TotalRedondeo := 0;
        Counter := 0;
        Progress.OPEN(ProgressMsg, Counter);

        if JobLedgerSummaryRec.FindSet() then begin
            LineNo := 10000;
            repeat
                if (not JobLedgerSummaryRec.IsTotalLine) then begin
                    if ResourceRec.Get(JobLedgerSummaryRec."Resource No") then begin
                        DeptCodeSuffix := COPYSTR(ResourceRec."Global Dimension 1 Code", STRPOS(ResourceRec."Global Dimension 1 Code", '-') + 1, 2);
                        GenJnlLine.Init();
                        GenJnlLine."Journal Template Name" := GenJnlTemplate.Name;
                        GenJnlLine."Journal Batch Name" := GenJnlBatch.Name;
                        GenJnlLine."Line No." := LineNo;
                        GenJnlLine."Posting Date" := PostingDate;
                        GenJnlLine."Document Type" := GenJnlLine."Document Type"::" ";
                        GenJnlLine."Document No." := JobLedgerSummaryRec."Resource No";
                        GenJnlLine."Account Type" := GenJnlLine."Account Type"::"G/L Account";
                        GenJnlLine."Account No." := '0000004';

                        GenJnlLine.Description := 'Ajuste desviacion ' + JobLedgerSummaryRec."Resource Name";
                        GenJnlLine."Job No." := ResourceRec.ARBVRNDesviationJob;
                        GenJnlLine."Job Task No." := ResourceRec.ARBVRNDesviationJobTask;
                        GenJnlLine.Validate("Job No.", GenJnlLine."Job No.");
                        GenJnlLine.Validate("Job Task No.", GenJnlLine."Job Task No.");
                        GenJnlLine.Amount := ROUND(JobLedgerSummaryRec."Total Cost by Payroll" - JobLedgerSummaryRec."Total Cost for Imputation", 0.01) * -1;
                        GenJnlLine."Bal. Account Type" := GenJnlLine."Bal. Account Type"::"G/L Account";
                        GenJnlLine."Bal. Account No." := '';
                        GenJnlLine."Shortcut Dimension 2 Code" := 'P64.00';
                        GenJnlLine.Validate("Shortcut Dimension 2 Code", GenJnlLine."Shortcut Dimension 2 Code");
                        GenJnlLine."Job Quantity" := 1;
                        GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                        GenJnlLine.Insert();
                        GenJnlLine."Job Quantity" := 1;
                        GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                        GenJnlLine.modify();
                        TotalRedondeo += ROUND(GenJnlLine.Amount, 0.01);
                        Counter += 1;
                        Progress.Update(1, Counter);

                        LineNo += 10000;

                        if ROUND(JobLedgerSummaryRec."Compensation Reserve", 0.01) <> 0 then begin
                            GenJnlLine.Init();
                            GenJnlLine."Journal Template Name" := GenJnlTemplate.Name;
                            GenJnlLine."Journal Batch Name" := GenJnlBatch.Name;
                            GenJnlLine."Line No." := LineNo;
                            GenJnlLine."Posting Date" := PostingDate;
                            GenJnlLine."Document Type" := GenJnlLine."Document Type"::" ";
                            GenJnlLine."Document No." := JobLedgerSummaryRec."Resource No";
                            GenJnlLine."Account Type" := GenJnlLine."Account Type"::"G/L Account";
                            GenJnlLine."Account No." := '0000004';
                            GenJnlLine."Job No." := 'PP00' + DeptCodeSuffix;
                            GenJnlLine."Job Task No." := 'PROVISION';
                            GenJnlLine.Validate("Job No.", GenJnlLine."Job No.");
                            GenJnlLine.Validate("Job Task No.", GenJnlLine."Job Task No.");
                            GenJnlLine.Description := 'Provision ' + JobLedgerSummaryRec."Resource Name";
                            GenJnlLine.Amount := ROUND(JobLedgerSummaryRec."Compensation Reserve", 0.01) * -1;
                            GenJnlLine."Bal. Account Type" := GenJnlLine."Bal. Account Type"::"G/L Account";
                            GenJnlLine."Bal. Account No." := '';
                            GenJnlLine."Shortcut Dimension 2 Code" := 'P64.01';
                            GenJnlLine.Validate("Shortcut Dimension 2 Code", GenJnlLine."Shortcut Dimension 2 Code");
                            GenJnlLine."Job Quantity" := 1;
                            GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                            GenJnlLine.Insert();
                            GenJnlLine."Job Quantity" := 1;
                            GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                            GenJnlLine.modify();
                            TotalRedondeo += ROUND(GenJnlLine.Amount, 0.01);
                            Counter += 1;
                            Progress.Update(1, Counter)
                        end;

                        LineNo += 10000;

                        if not JobLedgerSummaryRec.IsTotalLine then begin
                            JobLedgerGroupedRec.SetRange("Resource No.", JobLedgerSummaryRec."Resource No");
                            if JobLedgerGroupedRec.FindSet() then begin
                                repeat
                                    // Verificar si el proyecto está cerrado o bloqueado
                                    if JobRec.Get(JobLedgerGroupedRec."Job No.") then begin
                                        if (JobRec.Status = JobRec.Status::Completed) OR (JobRec."Blocked" = JobRec."Blocked"::"All") then begin
                                            OpenProject := Dialog.Confirm('El proyecto %1 está cerrado o bloqueado. ¿Desea abrirlo/desbloquearlo?', false, JobRec."No.");
                                            if OpenProject then begin
                                                JobRec.Status := JobRec.Status::Open;
                                                JobRec."Blocked" := JobRec."Blocked"::" ";
                                                JobRec.Modify();
                                                OpenedJobs."Job No." := JobRec."No.";
                                                OpenedJobs.SetRange("Job No.", JobRec."No.");
                                                IF not OpenedJobs.FindFirst() then
                                                    OpenedJobs.Insert();
                                            end else begin
                                                Error('El proyecto %1 está cerrado o bloqueado. No se puede continuar.', JobRec."No.");
                                            end;
                                        end;
                                    end;
                                    GenJnlLine.Init();
                                    GenJnlLine."Journal Template Name" := GenJnlTemplate.Name;
                                    GenJnlLine."Journal Batch Name" := GenJnlBatch.Name;
                                    GenJnlLine."Line No." := LineNo;
                                    GenJnlLine."Posting Date" := PostingDate;
                                    GenJnlLine."Document Type" := GenJnlLine."Document Type"::" ";
                                    GenJnlLine."Document No." := JobLedgerGroupedRec."Resource No.";
                                    GenJnlLine."Account Type" := GenJnlLine."Account Type"::"G/L Account";
                                    GenJnlLine."Account No." := '0000004';
                                    GenJnlLine.Description := 'Ajuste desviacion a proyecto ' + JobLedgerGroupedRec."Resource Name";
                                    GenJnlLine.Amount := ROUND(JobLedgerGroupedRec.Adjustment, 0.01) * -1;
                                    GenJnlLine."Bal. Account Type" := GenJnlLine."Bal. Account Type"::"G/L Account";
                                    GenJnlLine."Bal. Account No." := '';
                                    GenJnlLine."Job No." := JobLedgerGroupedRec."Job No.";
                                    GenJnlLine."Job Task No." := JobLedgerGroupedRec."Job Task No.";
                                    GenJnlLine.Validate("Job No.", GenJnlLine."Job No.");
                                    GenJnlLine.Validate("Job Task No.", GenJnlLine."Job Task No.");
                                    GenJnlLine."Shortcut Dimension 2 Code" := 'P64.00';
                                    GenJnlLine.Validate("Shortcut Dimension 2 Code", GenJnlLine."Shortcut Dimension 2 Code");
                                    GenJnlLine."Job Quantity" := 1;
                                    GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                                    GenJnlLine.Insert();
                                    GenJnlLine."Job Quantity" := 1;
                                    GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
                                    GenJnlLine.modify();
                                    TotalRedondeo += ROUND(GenJnlLine.Amount, 0.01);
                                    Counter += 1;
                                    Progress.Update(1, Counter);

                                    LineNo += 10000;
                                until JobLedgerGroupedRec.Next() = 0;
                            end else begin
                                Error('No se encontró el recurso con el número %1 en la tabla PS_Temp Grouped project Ledger.', JobLedgerSummaryRec."Resource No");
                            end;
                        end;

                    end else begin
                        Error('No se encontró el recurso con el número %1.', JobLedgerSummaryRec."Resource No");
                    end;
                end;
            until JobLedgerSummaryRec.Next() = 0;
        end;

        if ROUND(TotalRedondeo, 0.01) <> 0 then begin
            GenJnlLine.Init();
            GenJnlLine."Journal Template Name" := GenJnlTemplate.Name;
            GenJnlLine."Journal Batch Name" := GenJnlBatch.Name;
            GenJnlLine."Line No." := LineNo;
            GenJnlLine."Posting Date" := PostingDate;
            GenJnlLine."Document Type" := GenJnlLine."Document Type"::" ";
            GenJnlLine."Document No." := 'ADJUSTMENT';
            GenJnlLine."Account Type" := GenJnlLine."Account Type"::"G/L Account";
            GenJnlLine."Account No." := '0000007';

            GenJnlLine.Description := 'Ajuste de redondeo';
            GenJnlLine.Amount := ROUND(TotalRedondeo, 0.01) * -1;
            GenJnlLine."Bal. Account Type" := GenJnlLine."Bal. Account Type"::"G/L Account";
            GenJnlLine."Bal. Account No." := '';
            GenJnlLine."Job No." := '';
            GenJnlLine."Job Task No." := '';
            Counter += 1;
            GenJnlLine."Shortcut Dimension 2 Code" := 'P64.00';
            Progress.Update(1, Counter);
            GenJnlLine."Quantity" := 1;
            GenJnlLine."Job Quantity" := 1;
            GenJnlLine.Validate("Job Quantity", GenJnlLine."Job Quantity");
            GenJnlLine.Insert();

        end;
        Progress.CLOSE();
        COMMIt;
        CerrarProyectos();
        exit;
        // Enviar un correo electrónico con los proyectos que deben completarse o bloquearse
        //if (OpenedJobs.Count() > 0) OR (UnblockedJobs.Count() > 0) then
        //EnviarEmailProyectos(OpenedJobs, UnblockedJobs);
    end;

    local procedure CerrarProyectos()
    var
        ReturnCode: Action;
        OpenedJobs: Record PS_ReOpenProject;
        JobGLJnlPageID: Integer;
        GenJnlLine: Record "Gen. Journal Line";
        GenJnlBatch: Record "Gen. Journal Batch";
        OpenProject: Boolean;
        JobRec: Record Job;
    begin
        JobGLJnlPageID := Page::"Job G/L Journal";
        ReturnCode := PAGE.RUNMODAL(JobGLJnlPageID);
        GenJnlLine.init();
        if GenJnlBatch.Get('PROYECTOS', 'DESVIACION') then begin
            GenJnlLine.SetRange("Journal Template Name", GenJnlBatch."Journal Template Name");
            GenJnlLine.SetRange("Journal Batch Name", GenJnlBatch.Name);
        end;
        GenJnlLine.SetRange("Journal Template Name", GenJnlBatch."Journal Template Name");
        GenJnlLine.SetRange("Journal Batch Name", GenJnlBatch.Name);
        if GenJnlLine.FindFirst() then begin
            IF GenJnlLine."Account No." = '' then begin
                IF OpenedJobs.FindSet() THEN BEGIN
                    OpenProject := Dialog.Confirm('¿Desea cerrar los proyectos que fueron abiertos?', false);
                    if OpenProject then begin
                        repeat
                            if JobRec.Get(OpenedJobs."Job No.") then begin
                                JobRec.Status := JobRec.Status::Completed;
                                JobRec."Blocked" := JobRec."Blocked"::"All";
                                JobRec.Modify();
                            end;
                        until OpenedJobs.Next() = 0;
                        OpenedJobs.DeleteAll(); // Elimina todos los registros procesados
                    end;
                end;
            end
            else begin
                OpenProject := Dialog.Confirm('No se registro el asiento. Desea Registrarlo? De no registrarlo todos los proyectos abiertos en el proceso se cerraran y el asiento no sera valido.', false);
                if OpenProject then
                    CerrarProyectos()
                else begin

                    repeat
                        if JobRec.Get(OpenedJobs."Job No.") then begin
                            JobRec.Status := JobRec.Status::Completed;
                            JobRec."Blocked" := JobRec."Blocked"::"All";
                            JobRec.Modify();
                        end;
                    until OpenedJobs.Next() = 0;
                    OpenedJobs.DeleteAll(); // Elimina todos los registros procesados

                end;

            end;
        end;
    end;

    procedure EnviarEmailProyectos(OpenedJobs: List of [Code[20]]; UnblockedJobs: List of [Code[20]])
    var
        EmailMessage: Codeunit "Email Message";
        Email: Codeunit "Email";
        JobNo: Code[20];
        Body: Text[1024];
        CR: Char;
        LF: Char;
    begin
        // Crear el cuerpo del correo electrónico
        CR := 13;
        LF := 10;
        Body := 'Recuerde completar o bloquear los siguientes proyectos después de registrar el asiento en Diarios generales de proyectos sección DESVIACION' + CR + LF + CR + LF + CR + LF;
        if (OpenedJobs.Count() > 0) then begin

            Body += 'Proyectos que deben completarse: ';
            foreach JobNo in OpenedJobs do begin
                Body += JobNo + ' | ';
            end;
            Body += CR;
            Body += LF;
            Body += CR;
            Body += LF;
        end;
        if (UnblockedJobs.Count() > 0) then begin
            Body += 'Proyectos que deben bloquearse: ';
            foreach JobNo in UnblockedJobs do begin
                Body += JobNo + ' | ';
            end;
        END;
        Body += CR;
        Body += LF;
        Body += 'Muchas gracias. Equipo Business Central.';
        // Crear el mensaje de correo electrónico
        EmailMessage.Create('administracion@powersolution.es', 'Proyectos a completar o bloquear', Body);
        Email.Send(EmailMessage, "Email Scenario"::ProjCerBlo);

    end;

}
