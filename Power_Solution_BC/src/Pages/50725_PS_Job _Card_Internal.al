/// <summary>
/// Page PS_Job _Card_Planificacion (ID 50701).
/// </summary>
page 50725 "PS_Job _Card_Internal"
{
    Caption = 'Internal Project';
    PageType = Document;
    RefreshOnActivate = true;
    SourceTable = Job;
    AdditionalSearchTerms = 'Project';
    ApplicationArea = All;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {
            group(General)
            {
                Caption = 'General';
                field("No."; Rec."No.")
                {
                    ApplicationArea = All;
                    Importance = Standard;
                    ToolTip = 'Specifies the number of the involved entry or record, according to the specified number series.';
                    Visible = NoFieldVisible;

                    trigger OnAssistEdit()
                    begin
                        if Rec.AssistEdit(xRec) then
                            CurrPage.Update();
                    end;
                }
                field(Description; Rec.Description)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies a short description of the job.';
                    NotBlank = true;
                }
                field("Person Responsible"; Rec."Person Responsible")
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies the person at your company who is responsible for the job.';
                }
                field(ResponsabilityCenter; Rec.ARBVRNResponsabilityCenter)
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies the person at your company who is responsible for the job.';
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies a current status of the job. You can change the status for the project as it progresses. Final calculations can be made on completed jobs.';

                    trigger OnAssistEdit()
                    var
                        UserChoice: Integer;
                    begin
                        // Crear un diálogo manual con opciones limitadas
                        UserChoice := StrMenu('Open|Completed', 1); // 1 es el valor predeterminado

                        case UserChoice of
                            1:
                                Rec.Status := Rec.Status::Open;
                            2:
                                Rec.Status := Rec.Status::Completed;
                        end;

                        // Verificar condiciones por separado
                        if Rec.Status = Rec.Status::Completed then begin
                            if Rec.Complete then begin
                                Rec.RecalculateJobWIP();
                                CurrPage.Update(false);
                            end;
                        end;
                    end;

                    trigger OnValidate()
                    begin
                        if (Rec.Status = Rec.Status::Completed) and Rec.Complete then begin
                            Rec.RecalculateJobWIP();
                            CurrPage.Update(false);
                        end;
                    end;
                }
                field(Blocked; Rec.Blocked)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies that the related record is blocked from being posted in transactions, for example a customer that is declared insolvent or an item that is placed in quarantine.';
                }
                field("Last Date Modified"; Rec."Last Date Modified")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies when the project card was last modified.';
                }
                field("Project Manager"; Rec."Project Manager")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the person who is assigned to manage the job.';
                    Visible = False;
                }
                field("Department Code"; Rec."Global Dimension 1 Code")
                {
                    ApplicationArea = Jobs;
                    Importance = Additional;
                    ToolTip = 'Specify the project department.';
                }
                field("Do Not Consolidate"; Rec."PS_DoNotConsolidate")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies whether the project should be consolidated between companies.';
                }
            }
            group(Duration)
            {
                Caption = 'Duration';
                field("Creation Date"; Rec."Creation Date")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the date on which you set up the job.';
                }
                field("Starting Date"; Rec."Starting Date")
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies the date on which the project actually starts.';
                }
                field("Ending Date"; Rec."Ending Date")
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies the date on which the project is expected to be completed.';
                }


            }
            group("Task")
            {
                Visible = False;
                Caption = 'Tasks';
                part(JobTaskLines; "Job Task Lines Subform")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Tasks';
                    SubPageLink = "Job No." = field("No.");
                    SubPageView = sorting("Job Task No.")
                              order(Ascending);
                    UpdatePropagation = Both;
                    Editable = JobTaskLinesEditable;
                    Enabled = JobTaskLinesEditable;
                }
            }
            group("Teams")
            {
                Caption = 'Project Teams';
                part(JobTeams; "PS_Job_Teams_SubForm")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Jobs Team';
                    SubPageLink = "ARBVRNJobNo" = field("No.");
                    SubPageView = sorting("ARBVRNResourceNo")
                               order(Ascending);
                    UpdatePropagation = Both;
                    //Editable = JobTaskLinesEditable;
                    //Enabled = JobTaskLinesEditable;
                }
            }
        }
        area(factboxes)
        {
            part("PS Internal Statistics"; "PS Internal Statistics")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("No.");
                Visible = True;
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
            part(Control1902136407; "Job No. of Prices FactBox")
            {
                ApplicationArea = Suite;
                SubPageLink = "No." = field("No."),
                              "Resource Filter" = field("Resource Filter"),
                              "Posting Date Filter" = field("Posting Date Filter"),
                              "Resource Gr. Filter" = field("Resource Gr. Filter"),
                              "Planning Date Filter" = field("Planning Date Filter");
                Visible = false;
            }
            part(Control1905650007; "Job WIP/Recognition FactBox")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("No."),
                              "Resource Filter" = field("Resource Filter"),
                              "Posting Date Filter" = field("Posting Date Filter"),
                              "Resource Gr. Filter" = field("Resource Gr. Filter"),
                              "Planning Date Filter" = field("Planning Date Filter");
                Visible = false;
            }
            part("Job Details"; "Job Cost Factbox")
            {
                ApplicationArea = Jobs;
                Caption = 'Job Details';
                SubPageLink = "No." = field("No.");
                Visible = false;
            }
            systempart(Control1900383207; Links)
            {
                ApplicationArea = RecordLinks;
                Visible = true;
            }
            systempart(Control1905767507; Notes)
            {
                ApplicationArea = Notes;
                Visible = true;
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

                action("Work Project")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Work Project...';
                    Image = CreateLinesFromJob;
                    ToolTip = 'Admin Work Project.';
                    RunObject = Page "ARBVRNJobWorksList";
                    RunPageLink = "ARBVRNJobMatrixItBelongs" = field("No."), "ARBVRNJobMatrixWork" = CONST("Work Job");
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

                action(PS_Job_Task_Lines)
                {
                    ApplicationArea = All;
                    Caption = 'Job Task Lines';
                    Image = TaskList;
                    RunObject = Page "Job Task Lines";
                    RunPageLink = "Job No." = field("No.");
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
            // group(History)
            // {
            //     Caption = 'History';
            //     Image = History;
            //     action("Ledger Entries")
            //     {
            //         ApplicationArea = Jobs;
            //         Caption = 'Ledger Entries';
            //         Image = JobLedger;
            //         RunObject = Page "Job Ledger Entries";
            //         RunPageLink = "Job No." = field("No.");
            //         RunPageView = sorting("Job No.", "Job Task No.", "Entry Type", "Posting Date")
            //                       order(Descending);
            //         ShortCutKey = 'Ctrl+F7';
            //         ToolTip = 'View the history of transactions that have been posted for the selected record.';
            //     }
            //     action("Item Ledger Entries")
            //     {
            //         ApplicationArea = Jobs;
            //         Caption = 'Item Ledger Entries';
            //         Image = ItemLedger;
            //         RunObject = Page "Item Ledger Entries";
            //         RunPageLink = "Job No." = Field("No.");
            //         ToolTip = 'View the item ledger entries of items consumed by the job.';
            //     }
            //     action("Whse. Ledger Entries")
            //     {
            //         ApplicationArea = Jobs;
            //         Caption = 'Warehouse Entries';
            //         Image = Warehouse;
            //         RunObject = Page "Warehouse Entries";
            //         RunPageLink = "Source Type" = filter(210 | 167),
            //                         "Source No." = Field("No.");
            //         ToolTip = 'View the warehouse entries of items consumed by the job.';
            //     }
            // }
        }
        area(processing)
        {
            group("Copy")
            {
                Caption = 'Copy';
                Image = Copy;
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
        }
        area(Promoted)
        {
            group(Category_Process)
            {
                Caption = 'Process', Comment = 'Generated from the PromotedActionCategories property index 1.';

                actionref("PS_Job_Task_Lines..._Promoted"; "PS_Job_Task_Lines")
                {
                }
            }

            group(Category_Category7)
            {
                Caption = 'Job', Comment = 'Generated from the PromotedActionCategories property index 6.';

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
        PriceCalculationMgt: Codeunit "Price Calculation Mgt.";
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        SalesInvLine: Record "Sales Invoice Line"; // Referencia adicional para el ejemplo
        grp: Integer;
        ApplyJobFilter: Codeunit "ApplyJobFilter";
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
    begin
        SetNoFieldVisible();
        ActivateFields();
        ExtendedPriceEnabled := PriceCalculationMgt.IsExtendedPriceCalculationEnabled();
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
        Rec.SetFilter("No.", '<>PP* & <>PY* ');

    end;

    trigger OnAfterGetCurrRecord()
    begin
        if GuiAllowed() then
            SetControlVisibility();
    end;

    trigger OnAfterGetRecord()
    begin
        if GuiAllowed() then
            SetControlVisibility();
        UpdateShipToBillToGroupVisibility();
        SellToContact.GetOrClear(Rec."Sell-to Contact No.");
        BillToContact.GetOrClear(Rec."Bill-to Contact No.");
        UpdateBillToInformationEditable();
        JobTaskLinesEditable := Rec.CalcJobTaskLinesEditable();
    end;

    var
        FormatAddress: Codeunit "Format Address";
        FeatureTelemetry: Codeunit "Feature Telemetry";
        EmptyShipToCodeErr: Label 'The Code field can only be empty if you select Custom Address in the Ship-to field.';
        NoFieldVisible: Boolean;
        JobTaskLinesEditable: Boolean;
        ExtendedPriceEnabled: Boolean;
        IsBillToCountyVisible: Boolean;
        IsSellToCountyVisible: Boolean;
        IsShipToCountyVisible: Boolean;
        BillToInformationEditable: Boolean;
        ShouldSearchForCustByName: Boolean;


    protected var
        SellToContact: Record Contact;
        BillToContact: Record Contact;
        ShipToOptions: Enum "Sales Ship-to Options";
        BillToOptions: Enum "Sales Bill-to Options";

    local procedure SetNoFieldVisible()
    var
        DocumentNoVisibility: Codeunit DocumentNoVisibility;
    begin
        NoFieldVisible := DocumentNoVisibility.JobNoIsVisible();
    end;

    local procedure ActivateFields()
    begin
        IsBillToCountyVisible := FormatAddress.UseCounty(Rec."Bill-to Country/Region Code");
        IsSellToCountyVisible := FormatAddress.UseCounty(Rec."Sell-to Country/Region Code");
        IsShipToCountyVisible := FormatAddress.UseCounty(Rec."Ship-to Country/Region Code");
    end;

    local procedure UpdateShipToBillToGroupVisibility()
    begin
        case true of
            (Rec."Ship-to Code" = '') and Rec.ShipToNameEqualsSellToName() and Rec.ShipToAddressEqualsSellToAddress():
                ShipToOptions := ShipToOptions::"Default (Sell-to Address)";

            (Rec."Ship-to Code" = '') and (not Rec.ShipToNameEqualsSellToName() or not Rec.ShipToAddressEqualsSellToAddress()):
                ShipToOptions := ShipToOptions::"Custom Address";

            Rec."Ship-to Code" <> '':
                ShipToOptions := ShipToOptions::"Alternate Shipping Address";
        end;

        case true of
            (Rec."Bill-to Customer No." = Rec."Sell-to Customer No.") and Rec.BillToAddressEqualsSellToAddress():
                BillToOptions := BillToOptions::"Default (Customer)";

            (Rec."Bill-to Customer No." = Rec."Sell-to Customer No.") and (not Rec.BillToAddressEqualsSellToAddress()):
                BillToOptions := BillToOptions::"Custom Address";

            Rec."Bill-to Customer No." <> Rec."Sell-to Customer No.":
                BillToOptions := BillToOptions::"Another Customer";
        end;
    end;

    local procedure UpdateBillToInformationEditable()
    begin
        BillToInformationEditable :=
            (BillToOptions = BillToOptions::"Custom Address") OR
            (Rec."Bill-to Customer No." <> Rec."Sell-to Customer No.");
    end;

    local procedure SetControlVisibility()
    begin
        ShouldSearchForCustByName := Rec.ShouldSearchForCustomerByName(Rec."Sell-to Customer No.");
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeJobPlanningLinesAction(var Job: Record Job; var IsHandled: Boolean)
    begin
    end;

    trigger OnNewRecord(BelowxRec: Boolean)
    begin
        Rec.ARBVRNJobType := Rec.ARBVRNJobType::Structure;
    end;
}
