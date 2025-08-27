/// <summary>
/// Page PS_Job _Card_Planificacion (ID 50701).
/// </summary>
page 50701 "PS_Job _Card_Planificacion"
{
    Caption = 'Project Planification';
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


                field("Sell-to Customer No."; Rec."Sell-to Customer No.")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Customer No.';
                    Importance = Promoted;
                    NotBlank = true;
                    ToolTip = 'Specifies the number of the customer who will receive the products and be billed by default.';

                    trigger OnValidate()
                    begin
                        CurrPage.Update();
                    end;
                }
                field("Sell-to Customer Name"; Rec."Sell-to Customer Name")
                {
                    ApplicationArea = Jobs;
                    Caption = 'Customer Name';
                    Importance = Promoted;
                    NotBlank = true;
                    ShowMandatory = true;
                    ToolTip = 'Specifies the name of the customer who will receive the products and be billed by default.';

                    trigger OnValidate()
                    begin
                        Rec.SelltoCustomerNoOnAfterValidate(Rec, xRec);
                        CurrPage.Update();
                    end;

                    trigger OnLookup(var Text: Text): Boolean
                    begin
                        exit(Rec.LookupSellToCustomerName(Text));
                    end;
                }
                field(Status; Rec.Status)
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    ToolTip = 'Specifies a current status of the job. You can change the status for the project as it progresses. Final calculations can be made on completed jobs.';
                    Enabled = Rec.Status <> Rec.Status::Lost;
                    trigger OnValidate()
                    begin
                        if (Rec.Status = Rec.Status::Completed) and Rec.Complete then begin
                            Rec.RecalculateJobWIP();
                            CurrPage.Update(false);
                        end;
                    end;
                }
                field("% Probability"; Rec."PS_% Probability")
                {
                    ApplicationArea = Jobs;
                    Importance = Promoted;
                    Tooltip = 'Specifies the % probability for the project';
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
                }
                field("Do Not Consolidate"; Rec."PS_DoNotConsolidate")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies whether the project should be consolidated between companies.';
                }
            }

            group(Posting)
            {
                Caption = 'Posting';
                field("Job Posting Group"; Rec."Job Posting Group")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the posting group that links transactions made for the project with the appropriate general ledger accounts according to the general posting setup.';
                }
                field("Department Code"; Rec."Global Dimension 1 Code")
                {
                    ApplicationArea = Jobs;
                    Importance = Additional;
                    ToolTip = 'Specify a dimension code 1 for the job.';
                }
                field("Apply Usage Link"; Rec."Apply Usage Link")
                {
                    ApplicationArea = Jobs;
                    Importance = Additional;
                    ToolTip = 'Specifies whether usage entries, from the project journal or purchase line, for example, are linked to project planning lines. Select this check box if you want to be able to track the quantities and amounts of the remaining work needed to complete a project and to created a relationship between demand planning, usage, and sales. On a project card, you can select this check box if there are no existing project planning lines that include type Budget that have been posted. The usage link only applies to project planning lines that include type Budget.';
                }
                field("% Completed"; Rec.PercentCompleted())
                {
                    ApplicationArea = Jobs;
                    Caption = '% Completed';
                    Editable = false;
                    Importance = Promoted;
                    ToolTip = 'Specifies the percentage of the job''s estimated resource usage that has been posted as used.';
                }
                field("% Invoiced"; Rec.PercentInvoiced())
                {
                    ApplicationArea = Jobs;
                    Caption = '% Invoiced';
                    Editable = false;
                    Importance = Promoted;
                    ToolTip = 'Specifies the percentage of the job''s invoice value that has been posted as invoiced.';
                }
                field("% of Overdue Planning Lines"; Rec.PercentOverdue())
                {
                    ApplicationArea = Jobs;
                    Caption = '% of Overdue Planning Lines';
                    Editable = false;
                    Importance = Additional;
                    ToolTip = 'Specifies the percentage of the job''s planning lines where the planned delivery date has been exceeded.';
                }

            }
            group("Invoice and Shipping")
            {
                Caption = 'Invoice and Shipping';

                group("Bill-to")
                {
                    Caption = 'Bill-to';
                    field(BillToOptions; BillToOptions)
                    {
                        ApplicationArea = Jobs;
                        Caption = 'Bill-to';
                        ToolTip = 'Specifies the customer that the sales invoice will be sent to. Default (Customer): The same as the customer on the sales invoice. Another Customer: Any customer that you specify in the fields below.';

                        trigger OnValidate()
                        begin
                            if BillToOptions = BillToOptions::"Default (Customer)" then begin
                                Rec.Validate("Bill-to Customer No.", Rec."Sell-to Customer No.");
                                Rec.Validate("Bill-to Contact No.", Rec."Sell-to Contact No.");
                            end;

                            UpdateBillToInformationEditable();
                        end;
                    }
                    group(Control205)
                    {
                        ShowCaption = false;
                        Visible = NOT (BillToOptions = BillToOptions::"Default (Customer)");

                        field("Bill-to Customer No."; Rec."Bill-to Customer No.")
                        {
                            ApplicationArea = Jobs;
                            Importance = Promoted;
                            ShowMandatory = true;
                            ToolTip = 'Specifies the number of the customer who pays for the job.';
                            Visible = false;

                            trigger OnValidate()
                            begin
                                CurrPage.Update();
                            end;
                        }
                        field("Bill-to Name"; Rec."Bill-to Name")
                        {
                            Caption = 'Name';
                            ApplicationArea = Jobs;
                            Importance = Promoted;
                            ToolTip = 'Specifies the name of the customer who pays for the job.';
                            Editable = ((BillToOptions = BillToOptions::"Another Customer") or ((BillToOptions = BillToOptions::"Custom Address") and not ShouldSearchForCustByName));
                            Enabled = ((BillToOptions = BillToOptions::"Another Customer") or ((BillToOptions = BillToOptions::"Custom Address") and not ShouldSearchForCustByName));
                            NotBlank = true;

                            trigger OnValidate()
                            begin
                                if not ((BillToOptions = BillToOptions::"Custom Address") and not ShouldSearchForCustByName) then begin
                                    if Rec.GetFilter("Bill-to Customer No.") = xRec."Bill-to Customer No." then
                                        if Rec."Bill-to Customer No." <> xRec."Bill-to Customer No." then
                                            Rec.SetRange("Bill-to Customer No.");

                                    CurrPage.Update();
                                end;
                            end;
                        }
                        field("Bill-to Address"; Rec."Bill-to Address")
                        {
                            Caption = 'Address';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies the address of the customer to whom you will send the invoice.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;
                        }
                        field("Bill-to Address 2"; Rec."Bill-to Address 2")
                        {
                            Caption = 'Address 2';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies an additional line of the address.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;
                        }
                        field("Bill-to City"; Rec."Bill-to City")
                        {
                            Caption = 'City';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies the city of the address.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;
                        }
                        group(Control56)
                        {
                            ShowCaption = false;
                            Visible = IsBillToCountyVisible;
                            field("Bill-to County"; Rec."Bill-to County")
                            {
                                ApplicationArea = Jobs;
                                QuickEntry = false;
                                Importance = Additional;
                                ToolTip = 'Specifies the county code of the customer''s billing address.';
                                Caption = 'County';
                                Editable = BillToInformationEditable;
                                Enabled = BillToInformationEditable;
                            }
                        }
                        field("Bill-to Post Code"; Rec."Bill-to Post Code")
                        {
                            Caption = 'Post Code';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies the postal code of the customer who pays for the job.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;
                        }
                        field("Bill-to Country/Region Code"; Rec."Bill-to Country/Region Code")
                        {
                            Caption = 'Country/Region';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies the country/region code of the customer''s billing address.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;

                            trigger OnValidate()
                            begin
                                IsBillToCountyVisible := FormatAddress.UseCounty(Rec."Bill-to Country/Region Code");
                            end;
                        }
                        field("Bill-to Contact No."; Rec."Bill-to Contact No.")
                        {
                            Caption = 'Contact No.';
                            ApplicationArea = Jobs;
                            ToolTip = 'Specifies the number of the contact person at the customer''s billing address.';
                            Importance = Additional;
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;

                            trigger OnLookup(var Text: Text): Boolean
                            begin
                                if not Rec.BilltoContactLookup() then
                                    exit(false);
                                BillToContact.Get(Rec."Bill-to Contact No.");
                                Text := Rec."Bill-to Contact No.";
                                exit(true);
                            end;

                            trigger OnValidate()
                            begin
                                BillToContact.Get(Rec."Bill-to Contact No.");
                            end;
                        }
                        field(ContactPhoneNo; BillToContact."Phone No.")
                        {
                            Caption = 'Phone No.';
                            ApplicationArea = Jobs;
                            Editable = false;
                            Importance = Additional;
                            ExtendedDatatype = PhoneNo;
                            ToolTip = 'Specifies the telephone number of the customer contact person for the job.';
                        }
                        field(ContactMobilePhoneNo; BillToContact."Mobile Phone No.")
                        {
                            Caption = 'Mobile Phone No.';
                            ApplicationArea = Jobs;
                            Editable = false;
                            Importance = Additional;
                            ExtendedDatatype = PhoneNo;
                            ToolTip = 'Specifies the mobile telephone number of the customer contact person for the job.';
                        }
                        field(ContactEmail; BillToContact."E-Mail")
                        {
                            Caption = 'Email';
                            ApplicationArea = Jobs;
                            ExtendedDatatype = EMail;
                            Editable = false;
                            Importance = Additional;
                            ToolTip = 'Specifies the email address of the customer contact person for the job.';
                        }
                        field("Bill-to Contact"; Rec."Bill-to Contact")
                        {
                            Caption = 'Contact';
                            ApplicationArea = Jobs;
                            Importance = Additional;
                            ToolTip = 'Specifies the name of the contact person at the customer who pays for the job.';
                            Editable = BillToInformationEditable;
                            Enabled = BillToInformationEditable;
                        }
                    }
                }
                group("Payment Terms")
                {
                    caption = 'Payment Terms';

                    field("Payment Terms Code"; Rec."Payment Terms Code")
                    {
                        ApplicationArea = Jobs;
                        Tooltip = 'Specifies a formula that calculates the payment due date, payment discount date, and payment discount amount.';
                    }
                    field("Payment Method Code"; Rec."Payment Method Code")
                    {
                        ApplicationArea = Jobs;
                        Tooltip = 'Specifies how to make payment, such as with bank transfer, cash, or check.';
                        Importance = Additional;
                    }
                }
                group("Ship-to")
                {
                    Caption = 'Ship-to';

                    field(ShippingOptions; ShipToOptions)
                    {
                        ApplicationArea = Jobs;
                        Caption = 'Ship-to';
                        ToolTip = 'Specifies the address that the products on the sales document are shipped to. Default (Sell-to Address): The same as the customer''s sell-to address. Alternate Ship-to Address: One of the customer''s alternate ship-to addresses. Custom Address: Any ship-to address that you specify in the fields below.';

                        trigger OnValidate()
                        var
                            ShipToAddress: Record "Ship-to Address";
                            ShipToAddressList: Page "Ship-to Address List";
                        begin
                            case ShipToOptions of
                                ShipToOptions::"Default (Sell-to Address)":
                                    begin
                                        Rec.Validate("Ship-to Code", '');
                                        Rec.SyncShipToWithSellTo();
                                    end;
                                ShipToOptions::"Alternate Shipping Address":
                                    begin
                                        ShipToAddress.SetRange("Customer No.", Rec."Sell-to Customer No.");
                                        ShipToAddressList.LookupMode := true;
                                        ShipToAddressList.SetTableView(ShipToAddress);

                                        if ShipToAddressList.RunModal() = ACTION::LookupOK then begin
                                            ShipToAddressList.GetRecord(ShipToAddress);
                                            Rec.Validate("Ship-to Code", ShipToAddress.Code);
                                            IsShipToCountyVisible := FormatAddress.UseCounty(ShipToAddress."Country/Region Code");
                                        end else
                                            ShipToOptions := ShipToOptions::"Custom Address";
                                    end;
                                ShipToOptions::"Custom Address":
                                    begin
                                        Rec.Validate("Ship-to Code", '');
                                        IsShipToCountyVisible := FormatAddress.UseCounty(Rec."Ship-to Country/Region Code");
                                    end;
                            end;
                        end;
                    }
                    group(Control202)
                    {
                        ShowCaption = false;
                        Visible = NOT (ShipToOptions = ShipToOptions::"Default (Sell-to Address)");
                        field("Ship-to Code"; Rec."Ship-to Code")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Code';
                            Editable = ShipToOptions = ShipToOptions::"Alternate Shipping Address";
                            Importance = Promoted;
                            ToolTip = 'Specifies the code for another shipment address than the customer''s own address, which is entered by default.';

                            trigger OnValidate()
                            var
                                ShipToAddress: Record "Ship-to Address";
                            begin
                                if (xRec."Ship-to Code" <> '') and (Rec."Ship-to Code" = '') then
                                    Error(EmptyShipToCodeErr);
                                if Rec."Ship-to Code" <> '' then begin
                                    ShipToAddress.Get(Rec."Sell-to Customer No.", Rec."Ship-to Code");
                                    IsShipToCountyVisible := FormatAddress.UseCounty(ShipToAddress."Country/Region Code");
                                end else
                                    IsShipToCountyVisible := false;
                            end;
                        }
                        field("Ship-to Name"; Rec."Ship-to Name")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Name';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            ToolTip = 'Specifies the name that products on the sales document will be shipped to.';
                        }
                        field("Ship-to Address"; Rec."Ship-to Address")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Address';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            QuickEntry = false;
                            ToolTip = 'Specifies the address that products on the sales document will be shipped to.';
                        }
                        field("Ship-to Address 2"; Rec."Ship-to Address 2")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Address 2';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            QuickEntry = false;
                            ToolTip = 'Specifies additional address information.';
                        }
                        field("Ship-to City"; Rec."Ship-to City")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'City';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            QuickEntry = false;
                            ToolTip = 'Specifies the city of the customer on the sales document.';
                        }
                        group(Control82)
                        {
                            ShowCaption = false;
                            Visible = IsShipToCountyVisible;
                            field("Ship-to County"; Rec."Ship-to County")
                            {
                                ApplicationArea = Jobs;
                                Caption = 'County';
                                Editable = ShipToOptions = ShipToOptions::"Custom Address";
                                QuickEntry = false;
                                ToolTip = 'Specifies the state, province or county of the address.';
                            }
                        }
                        field("Ship-to Post Code"; Rec."Ship-to Post Code")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Post Code';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            QuickEntry = false;
                            ToolTip = 'Specifies the postal code.';
                        }
                        field("Ship-to Country/Region Code"; Rec."Ship-to Country/Region Code")
                        {
                            ApplicationArea = Jobs;
                            Caption = 'Country/Region';
                            Editable = ShipToOptions = ShipToOptions::"Custom Address";
                            Importance = Additional;
                            QuickEntry = false;
                            ToolTip = 'Specifies the customer''s country/region.';

                            trigger OnValidate()
                            begin
                                IsShipToCountyVisible := FormatAddress.UseCounty(Rec."Ship-to Country/Region Code");
                            end;
                        }
                    }
                    field("Ship-to Contact"; Rec."Ship-to Contact")
                    {
                        ApplicationArea = Jobs;
                        Caption = 'Contact';
                        ToolTip = 'Specifies the name of the contact person at the address that products on the sales document will be shipped to.';
                    }
                }
            }
            group(Duration)
            {
                Caption = 'Duration';
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
                field("Creation Date"; Rec."Creation Date")
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the date on which you set up the job.';
                }
            }
            group("Foreign Trade")
            {
                Caption = 'Foreign Trade';
                field("Currency Code"; Rec."Currency Code")
                {
                    ApplicationArea = Suite;
                    Importance = Promoted;
                    ToolTip = 'Specifies the currency code for the job. By default, the currency code is empty. If you enter a foreign currency code, it results in the project being planned and invoiced in that currency.';
                }
                field("Invoice Currency Code"; Rec."Invoice Currency Code")
                {
                    ApplicationArea = Suite;
                    ToolTip = 'Specifies the currency code you want to apply when creating invoices for a job. By default, the invoice currency code for a project is based on what currency code is defined on the customer card.';
                }
                field("Price Calculation Method"; Rec."Price Calculation Method")
                {
                    Visible = ExtendedPriceEnabled;
                    ApplicationArea = Basic, Suite;
                    Importance = Promoted;
                    ToolTip = 'Specifies the default method of the unit price calculation.';
                }
                field("Cost Calculation Method"; Rec."Cost Calculation Method")
                {
                    Visible = ExtendedPriceEnabled;
                    ApplicationArea = Basic, Suite;
                    Importance = Promoted;
                    ToolTip = 'Specifies the default method of the unit cost calculation.';
                }
                field("Exch. Calculation (Cost)"; Rec."Exch. Calculation (Cost)")
                {
                    ApplicationArea = Suite;
                    ToolTip = 'Specifies how project costs are calculated if you change the Currency Date or the Currency Code fields on a project planning Line or run the Change project Planning Line Dates batch job. Fixed LCY option: The project costs in the local currency are fixed. Any change in the currency exchange rate will change the value of project costs in a foreign currency. Fixed FCY option: The project costs in a foreign currency are fixed. Any change in the currency exchange rate will change the value of project costs in the local currency.';
                }
                field("Exch. Calculation (Price)"; Rec."Exch. Calculation (Price)")
                {
                    ApplicationArea = Suite;
                    ToolTip = 'Specifies how project sales prices are calculated if you change the Currency Date or the Currency Code fields on a project planning Line or run the Change project Planning Line Dates batch job. Fixed LCY option: The project prices in the local currency are fixed. Any change in the currency exchange rate will change the value of project prices in a foreign currency. Fixed FCY option: The project prices in a foreign currency are fixed. Any change in the currency exchange rate will change the value of project prices in the local currency.';
                }
            }

            group("Task")
            {
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
            part("PS Planning Statistics"; "PS Planning Statistics")
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
                Visible = true;
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

                actionref("Admin File Gestion._Promoted"; "Admin File Gestion")
                {
                }
                actionref("PS_Job_Task_Lines_Promoted"; "PS_Job_Task_Lines")
                {
                }
            }
            group(Category_Category0)
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
        PriceCalculationMgt: Codeunit "Price Calculation Mgt.";
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
        Rec.SetFilter(Status, 'Planning');
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
}
