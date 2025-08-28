#pragma implicitwith disable
page 50731 "PS_EconomicMonitoring"
{
    PageType = Worksheet;
    ApplicationArea = Basic;
    Caption = 'Economic Monitoring';
    AdditionalSearchTerms = 'Monitoring, Economic';
    Editable = true;
    UsageCategory = Lists;
    SourceTable = "PS_EconomicMonitoringMatrix";
    SourceTableView = SORTING("Probability", "Job No.", Concept, Type) ORDER(DESCENDING);
    SourceTableTemporary = true;

    layout
    {
        area(content)
        {

            field("Year Filter"; YearFilter)
            {
                ApplicationArea = All;
                Caption = 'Year';
                ToolTip = 'Select the year to filter by.';
                Editable = true;
                TableRelation = "PS_Year"."PS_Year";
                Visible = true;
                trigger OnValidate()
                begin
                    Rec.DeleteAll();
                    CurrPage.Update(false)
                end;
            }
            field("Departament Filter"; DepartamentFilter)
            {
                ApplicationArea = All;
                Caption = 'Departament';
                ToolTip = 'Select the Departament to filter by.';
                Editable = true;
                TableRelation = "Dimension Value".Code WHERE("Dimension Code" = FILTER('DPTO'));
                Visible = SinProjectTeamfilter;
                trigger OnLookup(var Text: Text): Boolean
                var
                    DimensionValue: Record "Dimension Value";
                begin
                    Clear(DimensionValue);
                    DimensionValue.SetRange("Dimension Code", 'DPTO');
                    DimensionValue.SetFilter(Code, UserDepartment); // Filtra solo los departamentos permitidos

                    if Page.RunModal(0, DimensionValue) = Action::LookupOK then begin
                        DepartamentFilter := DimensionValue.Code; // ✅ Asigna el valor a la variable
                        DimensionValue.SetRange("Dimension Code", 'DPTO');
                        DimensionValue.SetRange(Code, DepartamentFilter); // ✅ Busca el código exacto

                        if not DimensionValue.FindFirst() then begin
                            Error('El departamento %1 no es válido. Seleccione un departamento de la lista.', DepartamentFilter);
                        end;
                        CurrPage.Update(false); // ✅ Forza la actualización de la UI
                        CurrPage.SaveRecord(); // ✅ Guarda los cambios en la página
                        Rec.DeleteAll();
                        CurrPage.Update(false);
                        SetYear(YearFilter, DepartamentFilter);
                    end;
                end;

                trigger OnValidate()
                var
                    DimensionValue: Record "Dimension Value";
                begin
                    // Aplicar el filtro para verificar si el departamento ingresado está permitido
                    DimensionValue.SetRange("Dimension Code", 'DPTO');
                    DimensionValue.SetFilter(Code, UserDepartment); // ✅ Maneja múltiples valores si UserDepartment tiene más de uno

                    if not DimensionValue.Get(DepartamentFilter) then begin
                        Error('El departamento %1 no es válido. Seleccione un departamento de la lista permitida: %2.', DepartamentFilter, UserDepartment);
                    end;

                    Message('Validación correcta: %1', DepartamentFilter); // ✅ Confirmación si es válido
                end;
            }
            repeater("Project Data")
            {
                ShowAsTree = true;
                IndentationColumn = REC.HierarchyLevel;
                TreeInitialState = CollapseAll;
                field("HierarchyLevel"; Rec.HierarchyLevel)
                {
                    ApplicationArea = All;
                    Caption = 'Level';
                    Editable = false;
                    Visible = false; // Oculto en UI, usado solo para IndentationColumn
                }
                field("ProjectInfo"; GetProjectInfo())
                {
                    ApplicationArea = All;
                    Caption = 'Project & Description';
                    Editable = false;

                    trigger OnDrillDown()
                    var
                        JobRec: Record Job; // Registro de la tabla Job
                        JobCardPageID: Integer;
                    begin
                        // Abrir la página Job Card con el registro correspondiente
                        if JobRec.Get(Rec."Job No.") then begin
                            JobCardPageID := PAGE::"PS_Job _Card_Operational";
                            PAGE.Run(JobCardPageID, JobRec);
                        end else begin
                            Message('No se encontró el proyecto con el número %1', Rec."Job No.");
                        end;
                    end;
                }

                field("Probability"; FormattedProbability)
                {
                    ApplicationArea = All;
                    Caption = 'Probability';
                    Editable = false;
                    StyleExpr = BoldStyle;
                }
                field("Concept"; Rec."Concept")
                {
                    ApplicationArea = All;
                    Caption = 'Concept';
                    Editable = false;
                }
                field("Type"; Rec."Type")
                {
                    ApplicationArea = All;
                    Caption = 'Type';
                    Editable = false;
                }
                field("January"; Rec."JanImport")
                {
                    ApplicationArea = All;
                    Caption = 'January';
                    Editable = false;
                    Visible = Visible1;
                    StyleExpr = Rec."JanStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(01, YearFilter);
                    end;
                }
                field("February"; Rec."FebImport")
                {
                    ApplicationArea = All;
                    Caption = 'February';
                    Editable = false;
                    Visible = Visible2;
                    StyleExpr = Rec."FebStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(02, YearFilter);
                    end;
                }
                field("March"; Rec."MarImport")
                {
                    ApplicationArea = All;
                    Caption = 'March';
                    Editable = false;
                    Visible = Visible3;
                    StyleExpr = Rec."MarStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(03, YearFilter);
                    end;
                }
                field("April"; Rec."AprImport")
                {
                    ApplicationArea = All;
                    Caption = 'April';
                    Editable = false;
                    Visible = Visible4;
                    StyleExpr = Rec."AprStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(04, YearFilter);
                    end;
                }
                field("May"; Rec."MayImport")
                {
                    ApplicationArea = All;
                    Caption = 'May';
                    Editable = false;
                    Visible = Visible5;
                    StyleExpr = Rec."MayStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(05, YearFilter);
                    end;
                }
                field("June"; Rec."JunImport")
                {
                    ApplicationArea = All;
                    Caption = 'June';
                    Editable = false;
                    Visible = Visible6;
                    StyleExpr = Rec."JunStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(06, YearFilter);
                    end;
                }
                field("July"; Rec."JulImport")
                {
                    ApplicationArea = All;
                    Caption = 'July';
                    Editable = false;
                    Visible = Visible7;
                    StyleExpr = Rec."JulStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(07, YearFilter);
                    end;
                }
                field("August"; Rec."AugImport")
                {
                    ApplicationArea = All;
                    Caption = 'August';
                    Editable = false;
                    Visible = Visible8;
                    StyleExpr = Rec."AugStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(08, YearFilter);
                    end;
                }
                field("September"; Rec."SepImport")
                {
                    ApplicationArea = All;
                    Caption = 'September';
                    Editable = false;
                    Visible = Visible9;
                    StyleExpr = Rec."SepStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(09, YearFilter);
                    end;
                }
                field("October"; Rec."OctImport")
                {
                    ApplicationArea = All;
                    Caption = 'October';
                    Editable = false;
                    Visible = Visible10;
                    StyleExpr = Rec."OctStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(10, YearFilter);
                    end;
                }
                field("November"; Rec."NovImport")
                {
                    ApplicationArea = All;
                    Caption = 'November';
                    Editable = false;
                    Visible = Visible11;
                    StyleExpr = Rec."NovStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(11, YearFilter);
                    end;
                }
                field("December"; Rec."DecImport")
                {
                    ApplicationArea = All;
                    Caption = 'December';
                    Editable = false;
                    Visible = Visible12;
                    StyleExpr = Rec."DecStyleExpr";
                    trigger OnDrillDown()
                    begin
                        JobPlanningLines(12, YearFilter);
                    end;
                }
            }
        }

    }
    actions
    {
        area(processing)
        {
            action("Update")
            {
                ApplicationArea = All;
                Caption = 'Update';
                Image = Refresh;
                ToolTip = 'Update Matrix data';

                trigger OnAction()
                begin
                    SetYear(YearFilter, DepartamentFilter);
                end;
            }
            action("Close")
            {
                ApplicationArea = All;
                Caption = 'Close';
                Image = Close;
                ToolTip = 'Close';
                Visible = IsBusinessManagerUser;
                trigger OnAction()
                var
                    MonthlyClosingHelper: Codeunit "PS_MonthlyClosingHelper";
                    TempSelectedRecords: Record "PS_MonthClosing" temporary;
                    PS_MonthClosing: Record PS_MonthClosing;
                begin
                    TempSelectedRecords.Init();
                    PS_MonthClosing.SetRange(PS_JobNo, Rec."Job No.");
                    PS_MonthClosing.SetRange(PS_Status, TempSelectedRecords.PS_Status::Open);
                    PS_MonthClosing.FindFirst();
                    TempSelectedRecords.TransferFields(PS_MonthClosing);
                    TempSelectedRecords.Insert();
                    MonthlyClosingHelper.CerrarProyectosMes(TempSelectedRecords);
                end;
            }
        }
        area(Promoted)
        {
            group(Category_Process)
            {
                Caption = 'Process', Comment = 'Generated from the PromotedActionCategories property index 1.';

                group(Category_Category9)
                {
                    Caption = 'Post/Print', Comment = 'Generated from the PromotedActionCategories property index 8.';
                    ShowAs = SplitButton;

                    actionref(Post_Promoted; Update)
                    {
                    }
                    actionref(Preview_Promoted; Close)
                    {
                    }
                }
            }
        }
    }

    var
        YearFilter: Integer;
        DepartamentFilter: Code[20];
        PS_UniqueJobPlanningRec: Record "PS_UniqueJobPlanningMatriz";
        SelectedDepartment: Code[20];
        UserDepartment: Code[10];
        NumOfRecords: Integer;
        RecordCount: Integer;
        ProgressMsg: Label 'Procesando.......#1######################\';
        BoldStyle: Text[20];
        Progress: Dialog;
        Visible1: Boolean;
        Visible2: Boolean;
        Visible3: Boolean;
        Visible4: Boolean;
        Visible5: Boolean;
        Visible6: Boolean;
        Visible7: Boolean;
        Visible8: Boolean;
        Visible9: Boolean;
        Visible10: Boolean;
        Visible11: Boolean;
        Visible12: Boolean;
        SinProjectTeamfilter: Boolean;
        IconField: TexT;
        IsBusinessManagerUser: Boolean;
        Filter: Text;
        IsClosed: Boolean;
        FormattedProbability: Text[10];

    Procedure SetYear(Year: Integer; Departament: Code[20])
    begin
        YearFilter := Year;
        DepartamentFilter := Departament;
        // Reiniciar flags de visibilidad antes de recalcular
        Visible1 := false;
        Visible2 := false;
        Visible3 := false;
        Visible4 := false;
        Visible5 := false;
        Visible6 := false;
        Visible7 := false;
        Visible8 := false;
        Visible9 := false;
        Visible10 := false;
        Visible11 := false;
        Visible12 := false;
        IsMonthOpen();
        Rec.DeleteAll();
        RecordCount := 0;
        Progress.OPEN(ProgressMsg, RecordCount);
        PopulateMatrixInvoice();
        PopulateMatrixExpediente();
        PopulateMatrixCost();
        PopulateMatrixRealInvoice();
        PopulateMatrixRealCost();
        PopulateMatrixRealCostLabour();
        CurrPage.Update(false); // Refrescar el ListPart para que muestre los datos actualizados
        SetClosedMonthsInMatrix();
        Progress.CLOSE();
        CurrPage.Update(false);
    end;

    procedure PopulateMatrixExpediente();
    var

        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobOrigenData: Record "ARBVRNJobUnitPlanning";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
    begin
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet(false) then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                LocalMonthStr := Format(LocalMonth);
                Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, JobRec."PS_% Probability");
                    end;
                end;
                JobOrigenData.SetRange("ARBVRNJobNo", CurrentJobNo);
                JobOrigenData.SetRange("ARBVRNPlanningDate", FirstDayOfMonth, LastDayOfMonth);
                JobOrigenData.SetRange("ARBVRNReal", FALSE);
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                if JobOrigenData.FindSet() then begin
                    repeat
                        JobRec.Get(CurrentJobNo);
                        IF JobOrigenData.ARBVRNCertificationAmount <> 0 THEN BEGIN
                            if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                EnsureMatrixLine(Rec, JobOrigenData."ARBVRNJobNo", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                EnsureMatrixLine(Rec, JobOrigenData."ARBVRNJobNo", YearFilter, Rec.Concept::Invoice, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                EnsureMatrixLine(Rec, JobOrigenData."ARBVRNJobNo", YearFilter, Rec.Concept::Invoice, Rec.Type::P, 2, JobRec.Description, IsClosed, Probability);
                                UpdateMatrixMonthValue(Rec, LocalMonth, JobOrigenData.ARBVRNCertificationAmount);
                                Rec.Modify(false); // Guardar los cambios en el buffer temporal
                            END
                        end;
                    until JobOrigenData.Next() = 0;
                end;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false); // Refrescar la página
    end;

    procedure PopulateMatrixInvoice();
    var
        JobOrigenData: Record "Job Planning Line";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
    begin
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet(false) then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        if not Rec.Get(Rec.Concept::A, Rec.Type::A, CurrentJobNo, YearFilter) then begin
                            EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                        end;
                    end;
                end;
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    LocalMonthStr := Format(LocalMonth);
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Job No.", CurrentJobNo);
                    JobOrigenData.SetRange("Planning Date", FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Line Type", JobOrigenData."Line Type"::Billable);
                    JobOrigenData.SetLoadFields("Job No.", "Line Amount (LCY)");
                    if JobOrigenData.FindSet(false) then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            IF JobOrigenData."Line Amount (LCY)" <> 0 THEN BEGIN
                                Probability := GetProbabilityFromJob(JobRec);
                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Invoice, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Invoice, Rec.Type::P, 2, JobRec.Description, IsClosed, Probability);
                                    UpdateMatrixMonthValue(Rec, LocalMonth, (JobOrigenData."Line Amount (LCY)" * Probability) / 100);
                                    Rec.Modify(false);
                                end;
                            end;
                        until JobOrigenData.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false);
    end;

    procedure PopulateMatrixCost();
    var
        JobOrigenData: Record "Job Planning Line";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
        ConceptValue: Option;
    begin
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet(false) then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        if not Rec.Get(Rec.Concept::A, Rec.Type::A, CurrentJobNo, YearFilter) then begin
                            EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                        end;
                    end;
                end;
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    LocalMonthStr := Format(LocalMonth);
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Job No.", CurrentJobNo);
                    JobOrigenData.SetRange("Planning Date", FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Line Type", JobOrigenData."Line Type"::Budget);
                    JobOrigenData.SetLoadFields("Job No.", "Total Cost (LCY)", Type);
                    if JobOrigenData.FindSet(false) then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            IF JobOrigenData."Total Cost (LCY)" <> 0 THEN BEGIN
                                Probability := GetProbabilityFromJob(JobRec);
                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    if JobOrigenData.Type = JobOrigenData.Type::Resource then begin
                                        ConceptValue := Rec.Concept::Labour;
                                    end
                                    else begin
                                        ConceptValue := Rec.Concept::Cost;
                                    end;
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, ConceptValue, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, ConceptValue, Rec.Type::P, 2, JobRec.Description, IsClosed, Probability);
                                    UpdateMatrixMonthValue(
                                        Rec,
                                        LocalMonth,
                                        (JobOrigenData."Total Cost (LCY)" * Probability) / 100
                                    );
                                    Rec.Modify(false);
                                end;
                            end;

                        until JobOrigenData.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false);
    end;


    procedure PopulateMatrixRealInvoice();
    var
        JobOrigenData: Record "Job Ledger Entry";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
    begin
        // Inicializar la tabla temporal
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';

        // Verificar si hay un año seleccionado
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;

        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter)); // Solo meses abiertos
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet(false) then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";

                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        if not Rec.Get(Rec.Concept::A, Rec.Type::A, CurrentJobNo, YearFilter) then begin
                            EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                        end;
                    end;
                end;
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    LocalMonthStr := Format(LocalMonth);
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Job No.", CurrentJobNo);
                    JobOrigenData.SetRange("Document Date", FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Entry Type", JobOrigenData."Entry Type"::Sale);
                    JobOrigenData.SetLoadFields("Job No.", "Line Amount (LCY)");
                    if JobOrigenData.FindSet(false) then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            Probability := GetProbabilityFromJob(JobRec);
                            IF JobOrigenData."Line Amount (LCY)" <> 0 THEN BEGIN
                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Invoice, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Invoice, Rec.Type::R, 2, JobRec.Description, IsClosed, Probability);
                                    UpdateMatrixMonthValue(Rec, LocalMonth, JobOrigenData."Line Amount (LCY)" * -1);
                                    Rec.Modify(false);
                                end;
                            end;
                        until JobOrigenData.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false);
    end;


    procedure PopulateMatrixRealCost();
    var
        JobOrigenData: Record "Job Ledger Entry";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
        ConceptValue: Option;
    begin
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter));
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet(false) then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        if not Rec.Get(Rec.Concept::A, Rec.Type::A, CurrentJobNo, YearFilter) then begin
                            EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                        end;
                    end;
                end;
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    LocalMonthStr := Format(LocalMonth);
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Job No.", CurrentJobNo);
                    JobOrigenData.SetRange("Posting Date", FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Entry Type", JobOrigenData."Entry Type"::Usage);
                    JobOrigenData.SetFilter("Type", '%1|%2', JobOrigenData."Type"::Item, JobOrigenData."Type"::"G/L Account");
                    JobOrigenData.SetLoadFields("Job No.", "Total Cost (LCY)");
                    if JobOrigenData.FindSet(false) then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            Probability := GetProbabilityFromJob(JobRec);
                            IF JobOrigenData."Total Cost (LCY)" <> 0 THEN BEGIN
                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Cost, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Cost, Rec.Type::R, 2, JobRec.Description, IsClosed, Probability);
                                    UpdateMatrixMonthValue(Rec, LocalMonth, JobOrigenData."Total Cost (LCY)");
                                    Rec.Modify(false);
                                end;
                            end;
                        until JobOrigenData.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false);
    end;

    procedure PopulateMatrixRealCostLabour();
    var
        JobOrigenData: Record "Job Ledger Entry";
        PS_MonthClosingRec: Record "PS_MonthClosing";
        JobRec: Record "Job";
        LocalMonth: Integer;
        LocalMonthStr: Code[2];
        LocalYearStr: Code[4];
        TotalImport: Decimal;
        TotalCost: Decimal;
        CurrentJobNo: Code[20];
        PreviousJobNo: Code[20];
        COUNTA: INTEGER;
        FirstDayOfMonth: Date;
        LastDayOfMonth: Date;
        MONTH: INTEGER;
        Probability: Integer;
        ConceptValue: Option;
    begin
        TotalImport := 0;
        TotalCost := 0;
        PreviousJobNo := '';

        // Verificar si hay un año seleccionado
        if YearFilter = 0 then begin
            Message('Por favor seleccione un año.');
            exit;
        end;

        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter)); // Solo meses abiertos
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter THEN
            PS_MonthClosingRec.SetFilter(PS_JobNo, Filter);
        if PS_MonthClosingRec.FindSet() then begin
            repeat
                IsClosed := PS_MonthClosingRec.PS_Status = PS_MonthClosingRec.PS_Status::Close;
                RecordCount := RecordCount + 1;
                if (RecordCount mod 100) = 0 then
                    Progress.Update(1, RecordCount);
                CurrentJobNo := PS_MonthClosingRec."PS_JobNo";
                LocalMonthStr := PS_MonthClosingRec."PS_Month";
                LocalYearStr := PS_MonthClosingRec."PS_Year";
                if JobRec.Get(CurrentJobNo) then begin
                    Probability := GetProbabilityFromJob(JobRec);
                    if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                        if not Rec.Get(Rec.Concept::A, Rec.Type::A, CurrentJobNo, YearFilter) then begin
                            EnsureMatrixLine(Rec, CurrentJobNo, YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                        end;
                    end;
                end;
                IF PS_MonthClosingRec."PS_Month" <> '' THEN BEGIN
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");

                    LocalMonthStr := Format(LocalMonth);
                    Evaluate(LocalMonth, PS_MonthClosingRec."PS_Month");
                    GetMonthDateRange(LocalMonth, YearFilter, FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Job No.", CurrentJobNo);
                    JobOrigenData.SetRange("ARBVRNTimesheetdate", FirstDayOfMonth, LastDayOfMonth);
                    JobOrigenData.SetRange("Entry Type", JobOrigenData."Entry Type"::Usage);
                    JobOrigenData.SetRange("Type", JobOrigenData."Type"::Resource);
                    JobOrigenData.SetLoadFields("Job No.", "Total Cost (LCY)");
                    if JobOrigenData.FindSet(false) then begin
                        repeat
                            JobRec.Get(CurrentJobNo);
                            IF JobOrigenData."Total Cost (LCY)" <> 0 THEN BEGIN
                                Probability := GetProbabilityFromJob(JobRec);
                                if (JobRec.Status <> JobRec.Status::Lost) and (JobRec.Status <> JobRec.Status::Completed) then begin
                                    ConceptValue := Rec.Concept::Labour;
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::A, Rec.Type::A, 0, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Labour, Rec.Type::A, 1, JobRec.Description, IsClosed, Probability);
                                    EnsureMatrixLine(Rec, JobOrigenData."Job No.", YearFilter, Rec.Concept::Labour, Rec.Type::R, 2, JobRec.Description, IsClosed, Probability);
                                    UpdateMatrixMonthValue(Rec, LocalMonth, (JobOrigenData."Total Cost (LCY)" * Probability) / 100);
                                    Rec.Modify(false);
                                end;
                            end;

                        until JobOrigenData.Next() = 0;
                    end;
                END;
            until PS_MonthClosingRec.Next() = 0;
        end;
        CurrPage.Update(false);
    end;

    trigger OnClosePage()
    begin
        Rec.DeleteAll();
    end;

    procedure JobPlanningLines(PostingMonth: Integer; PostingYear: Integer)
    var
        JobPlanningLine: Record "Job Planning Line";
        JobLedgerEntry: Record "Job Ledger Entry";
        ARBVRNJobUnitPlanning: Record ARBVRNJobUnitPlanning;
        JobLedgerPageID: Integer;
        JobLedgerEntryID: Integer;
        AdminFileGestionID: Integer;
        FirstDay: Date;
        LastDay: Date;
        IsAdminFileGestion: Boolean;
    begin
        JobLedgerPageID := PAGE::"Job Planning Lines";
        JobLedgerEntryID := PAGE::"Job Ledger Entries";
        AdminFileGestionID := PAGE::"PS_AdminFileGestionLines";
        IsAdminFileGestion := False;
        FirstDay := DMY2DATE(1, PostingMonth, PostingYear); // Primer día del mes seleccionado
        LastDay := CALCDATE('-1D', CALCDATE('+1M', FirstDay)); // Último día del mes seleccionado
        JobPlanningLine.SetRange("Job No.", Rec."Job No.");
        JobPlanningLine.SetRange("Planning Date", FirstDay, LastDay);
        JobLedgerEntry.SetRange("Job No.", Rec."Job No.");
        if (rec.Concept = rec.Concept::Cost) and (rec.Type = rec.Type::P) then begin
            JobPlanningLine.SetFilter(Type, '<>%1', JobPlanningLine.Type::Resource);
            JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Budget);
            JobPlanningLine.SetRange("Schedule Line", true);
            JobLedgerEntry.SetRange("Document Date", FirstDay, LastDay);
        end
        else if (rec.Concept = rec.Concept::Invoice) and (rec.Type = rec.Type::P) then begin
            ARBVRNJobUnitPlanning.SetRange(ARBVRNJobNo, Rec."Job No.");
            ARBVRNJobUnitPlanning.SetRange(ARBVRNPlanningDate, FirstDay, LastDay);
            JobLedgerEntry.SetRange("Posting Date", FirstDay, LastDay);
            if ARBVRNJobUnitPlanning.FindSet() then
                IsAdminFileGestion := True
            else begin
                JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Billable);
                JobPlanningLine.SetRange("Contract Line", true);
            end;
        end
        else if (rec.Concept = rec.Concept::Labour) and (rec.Type = rec.Type::P) then begin
            JobPlanningLine.SetRange(Type, JobPlanningLine.Type::Resource);
            JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Budget);
            JobPlanningLine.SetRange("Schedule Line", true);
            JobLedgerEntry.SetRange("Document Date", FirstDay, LastDay);
        end
        else if (rec.Concept = rec.Concept::Invoice) and (rec.Type = rec.Type::R) then begin
            JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Sale);
            JobLedgerEntry.SetRange("Document Date", FirstDay, LastDay);
        END
        else if (rec.Concept = rec.Concept::Labour) and (rec.Type = rec.Type::R) then begin
            JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
            JobLedgerEntry.SetRange(Type, JobLedgerEntry.Type::Resource);
            JobLedgerEntry.SetRange("ARBVRNTimesheetdate", FirstDay, LastDay);
        END
        else if (rec.Concept = rec.Concept::Cost) and (rec.Type = rec.Type::R) then begin
            JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
            JobLedgerEntry.SetFilter(Type, '<>%1', JobLedgerEntry.Type::Resource);
            JobLedgerEntry.SetRange("Posting Date", FirstDay, LastDay);
        end;
        if (rec.Type = rec.Type::P) and IsAdminFileGestion then
            PAGE.RunModal(AdminFileGestionID, ARBVRNJobUnitPlanning)
        else if rec.Type = rec.Type::P then
            PAGE.RunModal(JobLedgerPageID, JobPlanningLine)
        else if rec.Type = rec.Type::R then
            PAGE.RunModal(JobLedgerEntryID, JobLedgerEntry);
    end;

    trigger OnOpenPage()
    var
        PS_EconomicMonitoringPage: Page "PS_EconomicMonitoring";
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        DimensionValue: Record "Dimension Value";
        JobRec: Record Job;
        SalesInvLine: Record "Sales Invoice Line"; // Referencia adicional para el ejemplo
        grp: Integer;
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
    begin
        CurrPage.Editable := true;
        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        RecRef.Open(Database::"Job", true);
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();
        if UserDepartment <> '' then begin
            SinProjectTeamfilter := False;
            DimensionValue.SetRange(DimensionValue.Code, UserDepartment);
            DepartamentFilter := UserDepartment;
        end;
        JobRec.FilterGroup(grp);
        FieldId := 1;
        EmptyRecRef.GetTable(Rec);
        EmptyRecRef.Reset(); // Asegurar que esté vacía
        LineFieldId := 0; // ID de campo no relevante para la referencia vacía
        if UserSetupRec.Get(UserId()) then begin
            if UserSetupRec."Project team filter" then begin
                SinProjectTeamfilter := False;
                ApplyFilter(RecRef, FieldId, JobTypeFilter, EmptyRecRef, LineFieldId);
            end
            else
                if UserDepartment = '' then
                    SinProjectTeamfilter := True;
        end else
            Error('No se encontró la configuración del usuario.');
        JobRec.FilterGroup(grp);
        Rec.FilterGroup(0);
        IsBusinessManagerUser := IsBusinessManager();
        Rec.DeleteAll();
        CurrPage.Editable(true);
        CurrPage.Update(false);
    end;

    procedure IsMonthOpen()
    var
        PS_MonthClosingRec: Record PS_MonthClosing;
        LocalMonth: Integer;
    begin
        PS_MonthClosingRec.SetRange("PS_Year", Format(YearFilter)); // Solo meses abiertos
        if DepartamentFilter <> '' then
            PS_MonthClosingRec.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if PS_MonthClosingRec.FindSet() then begin
            repeat
                EVALUATE(LocalMonth, PS_MonthClosingRec.PS_Month);
                case LocalMonth of
                    1:
                        Visible1 := True;   // Enero abierto
                    2:
                        Visible2 := True;  // Febrero cerrado
                    3:
                        Visible3 := True;   // Marzo abierto
                    4:
                        Visible4 := True;  // Abril abierto
                    5:
                        Visible5 := True;  // Mayo cerrado
                    6:
                        Visible6 := True;   // Junio abierto
                    7:
                        Visible7 := True;  // Julio cerrado
                    8:
                        Visible8 := True;   // Agosto abierto
                    9:
                        Visible9 := True;   // Septiembre abierto
                    10:
                        Visible10 := True; // Octubre cerrado
                    11:
                        Visible11 := True;  // Noviembre abierto
                    12:
                        Visible12 := True;  // Diciembre abierto
                end;
            until PS_MonthClosingRec.Next() = 0;
        END;
    end;

    trigger OnAfterGetRecord()
    begin
        Clear(BoldStyle);
        if Rec.HierarchyLevel = 0 then
            BoldStyle := 'StrongAccent'
        else
            BoldStyle := 'Standard';
        Clear(Rec.JanStyleExpr);
        Clear(Rec.FebStyleExpr);
        Clear(Rec.MarStyleExpr);
        Clear(Rec.AprStyleExpr);
        Clear(Rec.MayStyleExpr);
        Clear(Rec.JunStyleExpr);
        Clear(Rec.JulStyleExpr);
        Clear(Rec.AugStyleExpr);
        Clear(Rec.SepStyleExpr);
        Clear(Rec.OctStyleExpr);
        Clear(Rec.NovStyleExpr);
        Clear(Rec.DecStyleExpr);
        // Estilos por mes cerrado
        if Rec.IsJanClosed then
            Rec."JanStyleExpr" := 'Subordinate'
        else
            Rec."JanStyleExpr" := 'StrongAccent';

        if Rec.IsFebClosed then
            Rec."FebStyleExpr" := 'Subordinate'
        else
            Rec."FebStyleExpr" := 'StrongAccent';

        if Rec.IsMarClosed then
            Rec."MarStyleExpr" := 'Subordinate'
        else
            Rec."MarStyleExpr" := 'StrongAccent';

        if Rec.IsAprClosed then
            Rec."AprStyleExpr" := 'Subordinate'
        else
            Rec."AprStyleExpr" := 'StrongAccent';

        if Rec.IsMayClosed then
            Rec."MayStyleExpr" := 'Subordinate'
        else
            Rec."MayStyleExpr" := 'StrongAccent';

        if Rec.IsJunClosed then
            Rec."JunStyleExpr" := 'Subordinate'
        else
            Rec."JunStyleExpr" := 'StrongAccent';

        if Rec.IsJulClosed then
            Rec."JulStyleExpr" := 'Subordinate'
        else
            Rec."JulStyleExpr" := 'StrongAccent';

        if Rec.IsAugClosed then
            Rec."AugStyleExpr" := 'Subordinate'
        else
            Rec."AugStyleExpr" := 'StrongAccent';

        if Rec.IsSepClosed then
            Rec."SepStyleExpr" := 'Subordinate'
        else
            Rec."SepStyleExpr" := 'StrongAccent';

        if Rec.IsOctClosed then
            Rec."OctStyleExpr" := 'Subordinate'
        else
            Rec."OctStyleExpr" := 'StrongAccent';

        if Rec.IsNovClosed then
            Rec."NovStyleExpr" := 'Subordinate'
        else
            Rec."NovStyleExpr" := 'StrongAccent';

        if Rec.IsDecClosed then
            Rec."DecStyleExpr" := 'Subordinate'
        else
            Rec."DecStyleExpr" := 'StrongAccent';
        case FORMAT(Rec."Probability") of
            '100':
                FormattedProbability := '100%';
            '10':
                FormattedProbability := '10%';
            '30':
                FormattedProbability := '30%';
            '50':
                FormattedProbability := '50%';
            '70':
                FormattedProbability := '70%';
            '90':
                FormattedProbability := '90%';
            else
                FormattedProbability := 'Error';
        end;
    end;

    local procedure IsBusinessManager(): Boolean
    var
        UserSettings: Record "User Personalization";
        SecurityID: Guid;
        MsgText: Text;
    begin
        SecurityID := UserSecurityId();
        UserSettings.SetRange("User SID", SecurityID);
        if UserSettings.FindSet() then begin
            repeat
                MsgText += 'Profile ID encontrado: ' + UserSettings."Profile ID" + '\n';
            until UserSettings.Next() = 0;
        end else begin
            Message('No se encontraron perfiles para este usuario.');
        end;
        UserSettings.SetRange("Profile ID", 'BUSINESS MANAGER');
        exit(UserSettings.FindFirst());
    end;

    procedure ApplyFilter(var RecRef: RecordRef; FieldId: Integer; JobTypeFilter: Enum "PS_JobTypeEnum"; var AdditionalRecRef: RecordRef; AdditionalFieldId: Integer)
    var
        JobTeamRec: Record ARBVRNJobTeam;
        User: Record User;
        ResourceRec: Record Resource;
        JobRec: Record Job;
        UserEmail: Text[250];
        ResourceNo: Code[20];
        FilterCount: Integer;
        FirstJobNo: Code[20];
        FieldRef: FieldRef;
        JobTypeFilterText: Text[30];
        AdditionalFieldRef: FieldRef;
    begin
        // Obtener el ID del usuario actual
        if not User.Get(UserSecurityID) then begin
            Message('No se encontró el ID de usuario.');
            exit;
        end;
        UserEmail := User."Authentication Email";
        JobTypeFilterText := FORMAT(JobTypeFilter);
        ResourceRec.SetRange(ARBVRNEMail, UserEmail);
        if ResourceRec.FindFirst() then begin
            ResourceNo := ResourceRec."No.";
            JobTeamRec.SetRange(ARBVRNResourceNo, ResourceNo);
            Filter := '';
            FilterCount := 0;
            if JobTeamRec.FindSet() then begin
                repeat
                    if JobRec.Get(JobTeamRec.ARBVRNJobNo) and (not JobTeamRec.PS_SoloImputar) then begin

                        if (JobTypeFilter = JobTypeFilter::Todos) or (FORMAT(JobRec.ARBVRNJobType) = JobTypeFilterText) then begin
                            if FilterCount = 0 then
                                FirstJobNo := JobTeamRec.ARBVRNJobNo;
                            FilterCount += 1;
                        end;
                    end;
                until JobTeamRec.Next() = 0;
                FieldRef := RecRef.FIELD(FieldId);
                if FilterCount = 1 then begin
                    FieldRef.SETRANGE(FirstJobNo);
                end else begin
                    Filter := '';
                    JobTeamRec.FindSet();
                    repeat
                        if JobRec.Get(JobTeamRec.ARBVRNJobNo) and (not JobTeamRec.PS_SoloImputar) then begin
                            if (JobTypeFilter = JobTypeFilter::Todos) or (FORMAT(JobRec.ARBVRNJobType) = JobTypeFilterText) then begin
                                if Filter = '' then
                                    Filter := JobTeamRec.ARBVRNJobNo
                                else
                                    Filter := Filter + '|' + JobTeamRec.ARBVRNJobNo;
                            end;
                        end;
                    until JobTeamRec.Next() = 0;
                    IF FilterCount > 0 THEN BEGIN
                        FieldRef.SETFILTER(Filter);
                    END ELSE BEGIN
                        FieldRef.SETFILTER(Filter);
                    END;
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETFILTER(Filter);
                    end;
                end;
            end else begin
                FieldRef := RecRef.FIELD(FieldId);
                FieldRef.SETRANGE('');
                if AdditionalFieldId > 0 then begin
                    AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                    AdditionalFieldRef.SETRANGE('');
                end;
            end;
        end else begin
            Message('No se encontró el recurso con el correo %1.', UserEmail);
        end;
    end;

    local procedure UpdateMatrixMonthValue(var Matrix: Record "PS_EconomicMonitoringMatrix"; Month: Integer; Value: Decimal)
    begin
        case Month of
            1:
                Matrix."JanImport" += Value;
            2:
                Matrix."FebImport" += Value;
            3:
                Matrix."MarImport" += Value;
            4:
                Matrix."AprImport" += Value;
            5:
                Matrix."MayImport" += Value;
            6:
                Matrix."JunImport" += Value;
            7:
                Matrix."JulImport" += Value;
            8:
                Matrix."AugImport" += Value;
            9:
                Matrix."SepImport" += Value;
            10:
                Matrix."OctImport" += Value;
            11:
                Matrix."NovImport" += Value;
            12:
                Matrix."DecImport" += Value;
        end;
    end;

    local procedure GetProbabilityFromJob(JobRec: Record Job): Integer
    begin
        case JobRec."PS_% Probability" of
            JobRec."PS_% Probability"::"0":
                exit(100);
            JobRec."PS_% Probability"::"10":
                exit(10);
            JobRec."PS_% Probability"::"30":
                exit(30);
            JobRec."PS_% Probability"::"50":
                exit(50);
            JobRec."PS_% Probability"::"70":
                exit(70);
            JobRec."PS_% Probability"::"90":
                exit(90);
            else
                exit(0);
        end;
    end;

    local procedure EnsureMatrixLine(var Matrix: Record "PS_EconomicMonitoringMatrix"; JobNo: Code[20]; Year: Integer; Concept: Option; EntryType: Option; HierarchyLevel: Integer; Description: Text[100]; IsClosed: Boolean; Probability: Option)
    begin
        if not Matrix.Get(Concept, EntryType, JobNo, Year) then begin
            Matrix.Init();
            Matrix.HierarchyLevel := HierarchyLevel;
            Matrix.Description := Description;
            Matrix."Job No." := JobNo;
            Matrix.Year := Year;
            Matrix.Concept := Concept;
            Matrix.Type := EntryType;
            Matrix.IsClosedMonth := IsClosed;
            Matrix.Probability := Probability;
            Matrix.Insert();
        end;
    end;

    local procedure GetMonthDateRange(Month: Integer; Year: Integer; var FirstDay: Date; var LastDay: Date)
    begin
        FirstDay := DMY2DATE(1, Month, Year);
        LastDay := CALCDATE('-1D', CALCDATE('+1M', FirstDay));
    end;

    procedure SetClosedMonthsInMatrix()
    var
        MonthClosing: Record "PS_MonthClosing";
        LocalMonth: Integer;
        savedView: Text;
    begin
        MonthClosing.Reset();
        MonthClosing.SetRange("PS_Year", Format(YearFilter));
        MonthClosing.SetRange("PS_Status", MonthClosing."PS_Status"::Close);
        if DepartamentFilter <> '' then
            MonthClosing.SetRange(PS_GlobalDimension1Code, DepartamentFilter);
        if not SinProjectTeamfilter then
            MonthClosing.SetFilter(PS_JobNo, Filter);

        if MonthClosing.FindSet() then begin
            repeat
                Evaluate(LocalMonth, MonthClosing."PS_Month");

                savedView := Rec.GetView();
                Rec.Reset();
                Rec.SetRange("Job No.", MonthClosing.PS_JobNo);
                Rec.SetRange(Year, YearFilter);
                if Rec.FindSet() then begin
                    repeat
                        case LocalMonth of
                            1:
                                Rec.IsJanClosed := true;
                            2:
                                Rec.IsFebClosed := true;
                            3:
                                Rec.IsMarClosed := true;
                            4:
                                Rec.IsAprClosed := true;
                            5:
                                Rec.IsMayClosed := true;
                            6:
                                Rec.IsJunClosed := true;
                            7:
                                Rec.IsJulClosed := true;
                            8:
                                Rec.IsAugClosed := true;
                            9:
                                Rec.IsSepClosed := true;
                            10:
                                Rec.IsOctClosed := true;
                            11:
                                Rec.IsNovClosed := true;
                            12:
                                Rec.IsDecClosed := true;
                        end;
                        Rec.Modify(false);
                    until Rec.Next() = 0;
                end;
                Rec.SetView(savedView);
            until MonthClosing.Next() = 0;
        end;
    end;

    local procedure GetProjectInfo(): Text
    begin
        exit(Rec."Job No." + ' - ' + Rec.Description);
    end;
}


