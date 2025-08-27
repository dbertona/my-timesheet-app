/// <summary>
/// Unknown Microsoft.
/// </summary>

page 50700 "Job List Planificacion"
{
    AdditionalSearchTerms = 'Projects, Projects List';
    ApplicationArea = Jobs;
    Caption = 'Planning projects list';
    CardPageID = "PS_Job _Card_Planificacion";
    Editable = false;
    PageType = List;
    QueryCategory = 'Job List';
    SourceTable = job;
    UsageCategory = Lists;


    SourceTableView = sorting("No.") order(descending)
                  where(Status = filter('Planning' | 'Lost'));

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                ShowCaption = false;
                field("No."; Rec."No.")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the number of the involved entry or record, according to the specified number series.';
                }
                field(Description; Rec.Description)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies a short description of the job.';
                }
                field("Bill-to Customer No."; Rec."Bill-to Customer No.")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the number of the customer who pays for the job.';
                }
                field("Bill-to Name"; Rec."Bill-to name")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the number of the customer who pays for the job.';
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies a status for the current job. You can change the status for the project as it progresses. Final calculations can be made on completed jobs.';
                }
                field("Person Responsible"; Rec."Person Responsible")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the name of the person responsible for the job. You can select a name from the list of resources available in the Resource List window. The name is copied from the No. field in the Resource table. You can choose the field to see a list of resources.';
                    Visible = false;
                }
                field("Next Invoice Date"; Rec."Next Invoice Date")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the next invoice date for the job.';
                    Visible = false;
                }
                field("Job Posting Group"; Rec."Job Posting Group")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies a project posting group code for a job. To see the available codes, choose the field.';
                    Visible = false;
                }
                field("Search Description"; Rec."Search Description")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the additional name for the job. The field is used for searching purposes.';
                }
                field("% of Overdue Planning Lines"; Rec.PercentOverdue())
                {
                    ApplicationArea = Jobs;
                    Caption = '% of Overdue Planning Lines';
                    Editable = false;
                    ToolTip = 'Specifies the percent of planning lines that are overdue for this job.';
                    Visible = false;
                }
                field("% Completed"; Rec.PercentCompleted())
                {
                    ApplicationArea = Jobs;
                    Caption = '% Completed';
                    Editable = false;
                    ToolTip = 'Specifies the completion percentage for this job.';
                    Visible = false;
                }
                field("% Invoiced"; Rec.PercentInvoiced())
                {
                    ApplicationArea = Jobs;
                    Caption = '% Invoiced';
                    Editable = false;
                    ToolTip = 'Specifies the invoiced percentage for this job.';
                    Visible = false;
                }
                field("Project Manager"; Rec."Project Manager")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the person assigned as the manager for this job.';
                    Visible = false;
                }
                field("Global Dimension 1 Code"; Rec."Global Dimension 1 Code")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies one dimension code for this job.';
                    Visible = false;
                }
                field("% probability"; Rec."PS_% probability")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the % probability for the project';
                    Visible = false;
                }
            }
        }
        area(factboxes)
        {
            part("PS Planning Statistics"; "PS Planning Statistics")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("No.");
                Visible = true;
            }
            part(Control1907234507; "Sales Hist. Bill-to FactBox")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("Bill-to Customer No.");
                Visible = false;
            }
            part(Control1902018507; "Customer Statistics FactBox")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("Bill-to Customer No.");
                Visible = false;
            }
            part("Attached Documents"; "Doc. Attachment List Factbox")
            {
                ApplicationArea = All;
                Caption = 'Attachments';
                SubPageLink = "Table ID" = const(Database::Job),
                              "No." = field("No.");
            }
            systempart(Control1900383207; Links)
            {
                ApplicationArea = RecordLinks;
                Visible = false;
            }
            systempart(Control1905767507; Notes)
            {
                ApplicationArea = Notes;
            }
        }
    }

    actions
    {
        area(navigation)
        {
            group("Job")
            {
                Caption = 'Job';
                Image = Job;
                action(PS_Job_Task_Lines)
                {
                    ApplicationArea = All;
                    Caption = 'Job Task Lines';
                    Image = TaskList;
                    RunObject = Page "Job Task Lines";
                    RunPageLink = "Job No." = field("No.");
                    ToolTip = 'Plan how you want to set up your planning information. In this window you can specify the tasks involved in a job. To start planning a project or to post usage for a job, you must set up at least one project task.';
                }
                action(JobPlanningLines)
                {
                    ApplicationArea = Jobs;
                    Caption = 'Job Planning Lines';
                    Image = JobLines;
                    ToolTip = 'View all planning lines for the job. You use this window to plan what items, resources, and general ledger expenses that you expect to use on a project (Budget) or you can specify what you actually agreed with your customer that he should pay for the project (Billable).';

                    trigger OnAction()
                    var
                        JobPlanningLine: Record "Job Planning Line";
                        JobPlanningLines: Page "Job Planning Lines";
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeJobPlanningLinesAction(Rec, IsHandled);
                        if IsHandled then
                            exit;

                        Rec.TestField("No.");
                        JobPlanningLine.FilterGroup(2);
                        JobPlanningLine.SetRange("Job No.", Rec."No.");
                        JobPlanningLine.FilterGroup(0);
                        JobPlanningLines.SetJobTaskNoVisible(true);
                        JobPlanningLines.SetTableView(JobPlanningLine);
                        JobPlanningLines.Editable := true;
                        JobPlanningLines.Run();
                    end;
                }


                action("Dimensions")
                {
                    ApplicationArea = Dimensions;
                    Caption = 'Dimensions';
                    Image = Dimensions;
                    RunObject = Page "Default Dimensions";
                    RunPageLink = "Table ID" = const(167),
                                  "No." = field("No.");
                    ShortCutKey = 'Alt+D';
                    ToolTip = 'View or edit dimensions, such as area, project, or department, that you can assign to journal lines to distribute costs and analyze transaction history.';
                }
                action("Admin File Gestion")
                {
                    ApplicationArea = All;
                    Caption = 'Admin File Gestion';
                    Image = FileContract;
                    RunObject = Page "ARBVRNAdminFileGestion";
                    RunPageLink = "ARBVRNJobNo" = field("No.");
                    ToolTip = 'Plan how you want to set up your planning information. In this window you can specify the tasks involved in a job. To start planning a project or to post usage for a job, you must set up at least one project task.';
                }
                action("Statistics")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Aggregated Statistics';
                    Image = Statistics;
                    RunObject = Page "ARBVRNAdditionJobStatistics";
                    RunPageLink = "No." = field("No.");
                    ShortCutKey = 'F7';
                    ToolTip = 'View this job''s statistics.';
                }
                separator(Action64)
                {
                }
                action("Comments")
                {
                    ApplicationArea = Comments;
                    Caption = 'Comments';
                    Image = ViewComments;
                    RunObject = Page "Comment Sheet";
                    RunPageLink = "Table Name" = const(Job),
                                  "No." = field("No.");
                    ToolTip = 'View or add comments for the record.';
                }
                action(Attachments)
                {
                    ApplicationArea = All;
                    Caption = 'Attachments';
                    Image = Attach;
                    ToolTip = 'Add a file as an attachment. You can attach images as well as documents.';

                    trigger OnAction()
                    var
                        DocumentAttachmentDetails: Page "Document Attachment Details";
                        RecRef: RecordRef;
                    begin
                        RecRef.GetTable(Rec);
                        DocumentAttachmentDetails.OpenForRecRef(RecRef);
                        DocumentAttachmentDetails.RunModal();
                    end;
                }
            }
        }
        area(processing)
        {
            action("Copy project Tasks from...")
            {
                ApplicationArea = Jobs;
                Caption = 'Copy project Tasks from...';
                Ellipsis = true;
                Image = CopyToTask;
                ToolTip = 'Open the Copy project Tasks page.';

                trigger OnAction()
                var
                    CopyJobTasks: Page "Copy job Tasks";
                begin
                    CopyJobTasks.SetToJob(Rec);
                    CopyJobTasks.RunModal();
                end;
            }
            action("Copy project Tasks to...")
            {
                ApplicationArea = Jobs;
                Caption = 'Copy project Tasks to...';
                Ellipsis = true;
                Image = CopyFromTask;
                ToolTip = 'Open the Copy Jobs To page.';

                trigger OnAction()
                var
                    CopyJobTasks: Page "Copy job Tasks";
                begin
                    CopyJobTasks.SetFromJob(Rec);
                    CopyJobTasks.RunModal();
                end;
            }
        }
        area(Promoted)
        {

            group(Category_Category7)
            {
                Caption = 'Job', Comment = 'Generated from the PromotedActionCategories property index 6.';

                actionref("PS_Job_Task_Lines..._Promoted"; "PS_Job_Task_Lines")
                {
                }
                actionref("Admin File Gestion._Promoted"; "Admin File Gestion")
                {
                }
                actionref("Dimensions_Promoted"; "Dimensions")
                {
                }
                actionref("Statistics_Promoted"; "Statistics")
                {
                }
                actionref(Attachments_Promoted; Attachments)
                {
                }
                actionref("Comments_Promoted"; "Comments")
                {
                }

                separator(Navigate_Separator)
                {
                }

                actionref(JobPlanningLines_Promoted; JobPlanningLines)
                {
                }
            }
        }
    }

    trigger OnOpenPage()
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        SalesInvLine: Record "Sales Invoice Line"; // Referencia adicional para el ejemplo
        grp: Integer;
        ApplyJobFilter: Codeunit "PS_ApplyJobFilter";
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
    begin
        // Asegurarse de que JobRec y Rec están inicializados y abiertos
        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();
        if UserDepartment <> '' then
            Rec.SetRange(Rec."Global Dimension 1 Code", UserDepartment);
        JobRec.FilterGroup(grp);
        RecRef.GetTable(Rec); // Obtener la tabla en RecRef
        FieldId := 1; // ID del campo en la cabecera
        JobTypeFilter := JobTypeFilter::Operativo;

        // Configurar la referencia de registro vacía
        EmptyRecRef.GetTable(Rec);
        EmptyRecRef.Reset(); // Asegurar que esté vacía
        LineFieldId := 0; // ID de campo no relevante para la referencia vacía

        // Leer el registro de User Setup del usuario actual
        if UserSetupRec.Get(UserId()) then begin
            // Llamar al procedimiento ApplyFilter solo si "Project team filter" es verdadero
            if UserSetupRec."Project team filter" then
                ApplyJobFilter.ApplyFilter(RecRef, FieldId, JobTypeFilter, EmptyRecRef, LineFieldId);
        end else
            Error('No se encontró la configuración del usuario.');

        // Convertir el registro actual a RecordRef
        JobRec.FilterGroup(grp);
        RecRef.SetTable(Rec); // Establecer la tabla en RecRef
        Rec.FilterGroup(0);
        Rec.SetFilter(Status, 'Planning');
    end;



    trigger OnAfterGetCurrRecord()
    var
        PriceCalculationMgt: Codeunit "Price Calculation Mgt.";
    begin
        ExtendedPriceEnabled := PriceCalculationMgt.IsExtendedPriceCalculationEnabled();

    end;

    local procedure OnBeforeJobPlanningLinesAction(var Job: Record Job; var IsHandled: Boolean)
    begin
    end;

    var
        ExtendedPriceEnabled: Boolean;

}
