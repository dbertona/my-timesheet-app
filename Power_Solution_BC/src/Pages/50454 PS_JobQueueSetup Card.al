page 50454 "PS_JobQueueSetup Card"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'PS Job Queue Setup';
    SourceTable = "Job Queue Entry";
    SourceTableTemporary = true;

    layout
    {
        area(content)
        {
            group(Configuration)
            {
                Caption = 'Sync Worker Configuration';
                field(Status; Rec.Status)
                {
                    ApplicationArea = All;
                    ToolTip = 'Estado del Job Queue Entry';
                }
                field("Recurring Job"; Rec."Recurring Job")
                {
                    ApplicationArea = All;
                    ToolTip = 'Si el trabajo debe ejecutarse periódicamente';
                }
                field("Run on Mondays"; Rec."Run on Mondays")
                {
                    ApplicationArea = All;
                    ToolTip = 'Ejecutar los lunes';
                }
                field("Run on Tuesdays"; Rec."Run on Tuesdays")
                {
                    ApplicationArea = All;
                }
                field("Run on Wednesdays"; Rec."Run on Wednesdays")
                {
                    ApplicationArea = All;
                }
                field("Run on Thursdays"; Rec."Run on Thursdays")
                {
                    ApplicationArea = All;
                }
                field("Run on Fridays"; Rec."Run on Fridays")
                {
                    ApplicationArea = All;
                }
                field("Run on Saturdays"; Rec."Run on Saturdays")
                {
                    ApplicationArea = All;
                }
                field("Run on Sundays"; Rec."Run on Sundays")
                {
                    ApplicationArea = All;
                }
                field("Starting Time"; Rec."Starting Time")
                {
                    ApplicationArea = All;
                    ToolTip = 'Hora de inicio del trabajo';
                }
                field("Ending Time"; Rec."Ending Time")
                {
                    ApplicationArea = All;
                    ToolTip = 'Hora de fin del trabajo';
                }
                field("Inactivity Timeout Period"; Rec."Inactivity Timeout Period")
                {
                    ApplicationArea = All;
                    ToolTip = 'Período de timeout de inactividad';
                }
                field("Maximum No. of Attempts to Run"; Rec."Maximum No. of Attempts to Run")
                {
                    ApplicationArea = All;
                    ToolTip = 'Número máximo de intentos de ejecución';
                }
            }
            group(Information)
            {
                Caption = 'Job Information';
                field("Object Type to Run"; Rec."Object Type to Run")
                {
                    ApplicationArea = All;
                    ToolTip = 'Tipo de objeto a ejecutar';
                    Editable = false;
                }
                field("Object ID to Run"; Rec."Object ID to Run")
                {
                    ApplicationArea = All;
                    ToolTip = 'ID del objeto a ejecutar';
                    Editable = false;
                }
                field("Object Caption to Run"; Rec."Object Caption to Run")
                {
                    ApplicationArea = All;
                    ToolTip = 'Descripción del objeto a ejecutar';
                    Editable = false;
                }
                field("Parameter String"; Rec."Parameter String")
                {
                    ApplicationArea = All;
                    ToolTip = 'Parámetros para el objeto';
                    Editable = false;
                }
                field("Last Ready State"; Rec."Last Ready State")
                {
                    ApplicationArea = All;
                    ToolTip = 'Último estado de listo';
                }
                field("Earliest Start Date/Time"; Rec."Earliest Start Date/Time")
                {
                    ApplicationArea = All;
                    ToolTip = 'Fecha/hora más temprana de inicio';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(CreateJobQueue)
            {
                ApplicationArea = All;
                Caption = 'Crear Job Queue Entry';
                Image = CreateDocument;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    JobQueueEntry: Record "Job Queue Entry";
                begin
                    // Buscar si ya existe un Job Queue Entry para el SyncWorker
                    JobQueueEntry.SetRange("Object Type to Run", JobQueueEntry."Object Type to Run"::Codeunit);
                    JobQueueEntry.SetRange("Object ID to Run", 50442);
                    JobQueueEntry.SetRange("Object Caption to Run", 'PS_Analytics SyncWorker');
                    
                    if JobQueueEntry.FindFirst() then begin
                        Message('Ya existe un Job Queue Entry para PS_Analytics SyncWorker.\nID: %1\nEstado: %2', 
                                JobQueueEntry.ID, JobQueueEntry.Status);
                    end else begin
                        // Crear nuevo Job Queue Entry
                        JobQueueEntry.Init();
                        JobQueueEntry."Object Type to Run" := JobQueueEntry."Object Type to Run"::Codeunit;
                        JobQueueEntry."Object ID to Run" := 50442;
                        JobQueueEntry."Object Caption to Run" := 'PS_Analytics SyncWorker';
                        JobQueueEntry.Status := JobQueueEntry.Status::Ready;
                        JobQueueEntry."Recurring Job" := true;
                        JobQueueEntry."Run on Mondays" := true;
                        JobQueueEntry."Run on Tuesdays" := true;
                        JobQueueEntry."Run on Wednesdays" := true;
                        JobQueueEntry."Run on Thursdays" := true;
                        JobQueueEntry."Run on Fridays" := true;
                        JobQueueEntry."Run on Saturdays" := true;
                        JobQueueEntry."Run on Sundays" := true;
                        JobQueueEntry."Starting Time" := 000000T;
                        JobQueueEntry."Ending Time" := 235959T;
                        JobQueueEntry."Inactivity Timeout Period" := 60;
                        JobQueueEntry."Maximum No. of Attempts to Run" := 3;
                        JobQueueEntry.Insert(true);
                        
                        Message('Job Queue Entry creado exitosamente.\nID: %1\nEstado: %2', 
                                JobQueueEntry.ID, JobQueueEntry.Status);
                    end;
                end;
            }
            action(UpdateJobQueue)
            {
                ApplicationArea = All;
                Caption = 'Actualizar Job Queue Entry';
                Image = Refresh;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    JobQueueEntry: Record "Job Queue Entry";
                begin
                    // Buscar el Job Queue Entry existente
                    JobQueueEntry.SetRange("Object Type to Run", JobQueueEntry."Object Type to Run"::Codeunit);
                    JobQueueEntry.SetRange("Object ID to Run", 50442);
                    
                    if JobQueueEntry.FindFirst() then begin
                        JobQueueEntry.Status := Rec.Status;
                        JobQueueEntry."Recurring Job" := Rec."Recurring Job";
                        JobQueueEntry."Run on Mondays" := Rec."Run on Mondays";
                        JobQueueEntry."Run on Tuesdays" := Rec."Run on Tuesdays";
                        JobQueueEntry."Run on Wednesdays" := Rec."Run on Wednesdays";
                        JobQueueEntry."Run on Thursdays" := Rec."Run on Thursdays";
                        JobQueueEntry."Run on Fridays" := Rec."Run on Fridays";
                        JobQueueEntry."Run on Saturdays" := Rec."Run on Saturdays";
                        JobQueueEntry."Run on Sundays" := Rec."Run on Sundays";
                        JobQueueEntry."Starting Time" := Rec."Starting Time";
                        JobQueueEntry."Ending Time" := Rec."Ending Time";
                        JobQueueEntry."Inactivity Timeout Period" := Rec."Inactivity Timeout Period";
                        JobQueueEntry."Maximum No. of Attempts to Run" := Rec."Maximum No. of Attempts to Run";
                        JobQueueEntry.Modify(true);
                        
                        Message('Job Queue Entry actualizado exitosamente.\nID: %1', JobQueueEntry.ID);
                    end else begin
                        Message('No se encontró un Job Queue Entry para PS_Analytics SyncWorker.');
                    end;
                end;
            }
            action(DeleteJobQueue)
            {
                ApplicationArea = All;
                Caption = 'Eliminar Job Queue Entry';
                Image = Delete;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    JobQueueEntry: Record "Job Queue Entry";
                begin
                    // Buscar el Job Queue Entry existente
                    JobQueueEntry.SetRange("Object Type to Run", JobQueueEntry."Object Type to Run"::Codeunit);
                    JobQueueEntry.SetRange("Object ID to Run", 50442);
                    
                    if JobQueueEntry.FindFirst() then begin
                        if Confirm('¿Estás seguro de que quieres eliminar el Job Queue Entry ID %1?', false, JobQueueEntry.ID) then begin
                            JobQueueEntry.Delete(true);
                            Message('Job Queue Entry eliminado exitosamente.');
                        end;
                    end else begin
                        Message('No se encontró un Job Queue Entry para PS_Analytics SyncWorker.');
                    end;
                end;
            }
            action(RefreshData)
            {
                ApplicationArea = All;
                Caption = 'Actualizar Datos';
                Image = RefreshLines;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                begin
                    LoadJobQueueData();
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        LoadJobQueueData();
    end;

    local procedure LoadJobQueueData()
    var
        JobQueueEntry: Record "Job Queue Entry";
    begin
        // Limpiar tabla temporal
        Rec.Reset();
        Rec.DeleteAll();
        
        // Buscar el Job Queue Entry existente
        JobQueueEntry.SetRange("Object Type to Run", JobQueueEntry."Object Type to Run"::Codeunit);
        JobQueueEntry.SetRange("Object ID to Run", 50442);
        
        if JobQueueEntry.FindFirst() then begin
            // Copiar datos a tabla temporal
            Rec.Init();
            Rec := JobQueueEntry;
            Rec.Insert(true);
        end else begin
            // Crear registro temporal con valores por defecto
            Rec.Init();
            Rec."Object Type to Run" := Rec."Object Type to Run"::Codeunit;
            Rec."Object ID to Run" := 50442;
            Rec."Object Caption to Run" := 'PS_Analytics SyncWorker';
            Rec.Status := Rec.Status::Ready;
            Rec."Recurring Job" := true;
            Rec."Run on Mondays" := true;
            Rec."Run on Tuesdays" := true;
            Rec."Run on Wednesdays" := true;
            Rec."Run on Thursdays" := true;
            Rec."Run on Fridays" := true;
            Rec."Run on Saturdays" := true;
            Rec."Run on Sundays" := true;
            Rec."Starting Time" := 000000T;
            Rec."Ending Time" := 235959T;
            Rec."Inactivity Timeout Period" := 60;
            Rec."Maximum No. of Attempts to Run" := 3;
            Rec.Insert(true);
        end;
    end;
}
