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
    SourceTableView = SORTING("Job No.", "Year", SortConcept, "HierarchyLevel", SortType, Description);
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
                IndentationColumn = Rec.HierarchyLevel;
                TreeInitialState = ExpandAll;
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
                    StyleExpr = ProjectStyleExpr;
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 01;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(01, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(01, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 02;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(02, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(02, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 03;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(03, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(03, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 04;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(04, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(04, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 05;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(05, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(05, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 06;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(06, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(06, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 07;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(07, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(07, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 08;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(08, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(08, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 09;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(09, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(09, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 10;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(10, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(10, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 11;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(11, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(11, Rec."Job No.", Rec.Concept, Rec.Type);
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
                        // Capturar valor actual antes de abrir BC
                        CurrentDrillDownMonth := 12;
                        CurrentDrillDownJobNo := Rec."Job No.";
                        CurrentDrillDownConcept := Rec.Concept;
                        CurrentDrillDownType := Rec.Type;

                        // Abrir página de BC
                        JobPlanningLines(12, YearFilter);

                        // Sincronizar al regresar
                        SyncMonthValueAfterDrillDown(12, Rec."Job No.", Rec.Concept, Rec.Type);
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
                    LocalMonth: Integer;
                begin
                    // Solo ejecutar el cierre (la confirmación se maneja en MonthlyClosingHelper)
                    TempSelectedRecords.Init();
                    PS_MonthClosing.SetRange(PS_JobNo, Rec."Job No.");
                    PS_MonthClosing.SetRange(PS_Status, TempSelectedRecords.PS_Status::Open);
                    if PS_MonthClosing.FindFirst() then
                        Evaluate(LocalMonth, PS_MonthClosing.PS_Month);
                    TempSelectedRecords.TransferFields(PS_MonthClosing);
                    TempSelectedRecords.Insert();
                    MonthlyClosingHelper.CerrarProyectosMes(TempSelectedRecords);
                    // Actualizar flags de cierre en la tabla temporal para este proyecto
                    UpdateClosedMonthsForJob(Rec."Job No.");
                    MarkProjectRecentlyClosed(Rec."Job No.");

                    // Refrescar únicamente el mes cerrado para este proyecto
                    if LocalMonth <> 0 then
                        RefreshProjectMonthAfterClose(Rec."Job No.", LocalMonth);
                end;
            }
            action(UpdateClosedMonths)
            {
                ApplicationArea = All;
                Caption = 'Actualizar cierres';
                Image = Refresh;

                trigger OnAction()
                begin
                    SetClosedMonthsInMatrix();
                    CurrPage.Update(false);
                end;
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
        ProjectStyleExpr: Text[20];
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

        // Variables para sincronización BC ↔ Tabla Temporal
        CurrentDrillDownMonth: Integer;
        CurrentDrillDownJobNo: Code[20];
        CurrentDrillDownConcept: Option;
        CurrentDrillDownType: Option; // Cambiado de Enum a Option para ser compatible con Rec.Type
        LastBCValue: Decimal;

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

    local procedure UpdateClosedMonthsForJob(JobNo: Code[20])
    var
        MonthClosing: Record "PS_MonthClosing";
        LocalMonth: Integer;
        savedView: Text;
    begin
        MonthClosing.Reset();
        MonthClosing.SetRange(PS_JobNo, JobNo);
        MonthClosing.SetRange("PS_Year", Format(YearFilter));
        MonthClosing.SetRange("PS_Status", MonthClosing."PS_Status"::Close);
        if MonthClosing.FindSet() then begin
            repeat
                Evaluate(LocalMonth, MonthClosing."PS_Month");

                savedView := Rec.GetView();
                Rec.Reset();
                Rec.SetRange("Job No.", JobNo);
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

    local procedure MarkProjectRecentlyClosed(JobNo: Code[20])
    var
        savedView: Text;
    begin
        savedView := Rec.GetView();
        Rec.Reset();
        Rec.SetRange("Job No.", JobNo);
        Rec.SetRange(Year, YearFilter);
        if Rec.FindSet() then begin
            repeat
                Rec.IsRecentlyClosed := true;
                Rec.Modify(false);
            until Rec.Next() = 0;
        end;
        Rec.SetView(savedView);
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
        if (rec.Type = rec.Type::P) and IsAdminFileGestion then begin
            PAGE.RunModal(AdminFileGestionID, ARBVRNJobUnitPlanning);
            // Sincronizar al regresar de expedientes
            SyncMonthValueAfterDrillDown(CurrentDrillDownMonth, Rec."Job No.", Rec.Concept, Rec.Type);
        end
        else if rec.Type = rec.Type::P then begin
            PAGE.RunModal(JobLedgerPageID, JobPlanningLine);
            // Sincronizar al regresar de planificados
            SyncMonthValueAfterDrillDown(CurrentDrillDownMonth, Rec."Job No.", Rec.Concept, Rec.Type);
        end
        else if rec.Type = rec.Type::R then begin
            PAGE.RunModal(JobLedgerEntryID, JobLedgerEntry);
            // Sincronizar al regresar de reales
            SyncMonthValueAfterDrillDown(CurrentDrillDownMonth, Rec."Job No.", Rec.Concept, Rec.Type);
        end;
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
        // Inicializar JobTypeFilter con valor por defecto para evitar conversión implícita
        JobTypeFilter := JobTypeFilter::Todos;
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
        UpdateRowStyles();
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

    local procedure UpdateRowStyles()
    begin
        Clear(BoldStyle);
        if Rec.HierarchyLevel = 0 then
            BoldStyle := 'StrongAccent'
        else
            BoldStyle := 'Standard';

        if Rec.IsRecentlyClosed then
            ProjectStyleExpr := 'Favorable'
        else
            ProjectStyleExpr := BoldStyle;

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

        if Rec.IsJanClosed then Rec."JanStyleExpr" := 'Subordinate' else Rec."JanStyleExpr" := 'StrongAccent';
        if Rec.IsFebClosed then Rec."FebStyleExpr" := 'Subordinate' else Rec."FebStyleExpr" := 'StrongAccent';
        if Rec.IsMarClosed then Rec."MarStyleExpr" := 'Subordinate' else Rec."MarStyleExpr" := 'StrongAccent';
        if Rec.IsAprClosed then Rec."AprStyleExpr" := 'Subordinate' else Rec."AprStyleExpr" := 'StrongAccent';
        if Rec.IsMayClosed then Rec."MayStyleExpr" := 'Subordinate' else Rec."MayStyleExpr" := 'StrongAccent';
        if Rec.IsJunClosed then Rec."JunStyleExpr" := 'Subordinate' else Rec."JunStyleExpr" := 'StrongAccent';
        if Rec.IsJulClosed then Rec."JulStyleExpr" := 'Subordinate' else Rec."JulStyleExpr" := 'StrongAccent';
        if Rec.IsAugClosed then Rec."AugStyleExpr" := 'Subordinate' else Rec."AugStyleExpr" := 'StrongAccent';
        if Rec.IsSepClosed then Rec."SepStyleExpr" := 'Subordinate' else Rec."SepStyleExpr" := 'StrongAccent';
        if Rec.IsOctClosed then Rec."OctStyleExpr" := 'Subordinate' else Rec."OctStyleExpr" := 'StrongAccent';
        if Rec.IsNovClosed then Rec."NovStyleExpr" := 'Subordinate' else Rec."NovStyleExpr" := 'StrongAccent';
        if Rec.IsDecClosed then Rec."DecStyleExpr" := 'Subordinate' else Rec."DecStyleExpr" := 'StrongAccent';
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

                        if (JobTypeFilter = JobTypeFilter::Todos) or IsJobTypeMatching(JobRec.ARBVRNJobType, JobTypeFilter) then begin
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

    local procedure IsJobTypeMatching(ARBVRNJobType: Option; JobTypeFilter: Enum "PS_JobTypeEnum"): Boolean
    begin
        case JobTypeFilter of
            JobTypeFilter::Todos:
                exit(true);
            JobTypeFilter::Operativo:
                exit(ARBVRNJobType = 0); // Operativo = 0
            JobTypeFilter::Estructura:
                exit(ARBVRNJobType = 1); // Structure = 1
            else
                exit(false);
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
            // Ordenación estable para TreeView
            case Concept of
                Matrix.Concept::A:
                    Matrix.SortConcept := 0; // Padre
                Matrix.Concept::Cost:
                    Matrix.SortConcept := 1; // Gasto
                Matrix.Concept::Invoice:
                    Matrix.SortConcept := 2; // Facturación
                Matrix.Concept::Labour:
                    Matrix.SortConcept := 3; // Mano de Obra
            end;
            case EntryType of
                Matrix.Type::A:
                    Matrix.SortType := 0;
                Matrix.Type::R:
                    Matrix.SortType := 1;
                Matrix.Type::P:
                    Matrix.SortType := 2;
            end;
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
                        if Rec.Get(Rec.Concept, Rec.Type, Rec."Job No.", Rec.Year) then begin
                            UpdateRowStyles();
                            CurrPage.UPDATE(false);
                        end;
                        Rec.Modify(false);
                        if Rec.Get(Rec.Concept, Rec.Type, Rec."Job No.", Rec.Year) then begin
                            UpdateRowStyles();
                            CurrPage.UPDATE(false);
                        end;
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

    local procedure RefreshProjectValuesAfterClose(JobNo: Code[20])
    var
        savedView: Text;
        LocalRec: Record "PS_EconomicMonitoringMatrix";
        CurrentValue: Decimal;
        BCValue: Decimal;
        Month: Integer;
    begin
        // Guardar la vista actual
        savedView := Rec.GetView();

        // Actualizar solo los valores que cambiaron, usando la lógica de SyncMonthValueAfterDrillDown
        LocalRec.Reset();
        LocalRec.SetRange("Job No.", JobNo);
        LocalRec.SetRange(Year, YearFilter);
        if LocalRec.FindSet() then begin
            repeat
                // Omitir filas de encabezado (Type::A)
                if LocalRec.Type <> LocalRec.Type::A then begin
                    // Verificar cada mes para ver si hay cambios
                    for Month := 1 to 12 do begin
                        CurrentValue := GetCurrentMonthValue(LocalRec, Month);
                        BCValue := GetMonthValueFromBC(Month, JobNo, LocalRec.Concept, LocalRec.Type);

                        // Solo actualizar si hay diferencias
                        if BCValue <> CurrentValue then begin
                            UpdateMatrixMonthValue(LocalRec, Month, BCValue - CurrentValue);
                        end;
                    end;

                    LocalRec.Modify(false);
                end;
            until LocalRec.Next() = 0;
        end;

        // Restaurar la vista original
        Rec.SetView(savedView);
    end;

    local procedure RefreshProjectMonthAfterClose(JobNo: Code[20]; Month: Integer)
    var
        savedView: Text;
        savedPosition: Text;
        NewValue: Decimal;
    begin
        // Guardar vista y posición actual para restaurar foco
        savedView := Rec.GetView();
        savedPosition := Rec.GetPosition();

        // Actualizar directamente el buffer de la página (Rec)
        Rec.Reset();
        Rec.SetRange("Job No.", JobNo);
        Rec.SetRange(Year, YearFilter);
        if Rec.FindSet() then begin
            repeat
                // Omitir filas de encabezado (Type::A)
                if Rec.Type <> Rec.Type::A then begin
                    NewValue := GetMonthValueFromBC(Month, JobNo, Rec.Concept, Rec.Type);
                    case Month of
                        1:
                            Rec."JanImport" := NewValue;
                        2:
                            Rec."FebImport" := NewValue;
                        3:
                            Rec."MarImport" := NewValue;
                        4:
                            Rec."AprImport" := NewValue;
                        5:
                            Rec."MayImport" := NewValue;
                        6:
                            Rec."JunImport" := NewValue;
                        7:
                            Rec."JulImport" := NewValue;
                        8:
                            Rec."AugImport" := NewValue;
                        9:
                            Rec."SepImport" := NewValue;
                        10:
                            Rec."OctImport" := NewValue;
                        11:
                            Rec."NovImport" := NewValue;
                        12:
                            Rec."DecImport" := NewValue;
                    end;
                    Rec.Modify(false);
                end;
            until Rec.Next() = 0;
        end;

        // Restaurar vista y posición anterior
        Rec.SetView(savedView);
        Rec.SetPosition(savedPosition);
        CurrPage.Update(false);
    end;

    local procedure GetCurrentMonthValue(var Matrix: Record "PS_EconomicMonitoringMatrix"; Month: Integer): Decimal
    begin
        case Month of
            1:
                exit(Matrix."JanImport");
            2:
                exit(Matrix."FebImport");
            3:
                exit(Matrix."MarImport");
            4:
                exit(Matrix."AprImport");
            5:
                exit(Matrix."MayImport");
            6:
                exit(Matrix."JunImport");
            7:
                exit(Matrix."JulImport");
            8:
                exit(Matrix."AugImport");
            9:
                exit(Matrix."SepImport");
            10:
                exit(Matrix."OctImport");
            11:
                exit(Matrix."NovImport");
            12:
                exit(Matrix."DecImport");
        end;
    end;


    local procedure SyncMonthValueAfterDrillDown(Month: Integer; JobNo: Code[20]; Concept: Option; Type: Option)
    var
        savedView: Text;
        CurrentValue: Decimal;
        BCValue: Decimal;
    begin
        // Evitar sincronizar encabezados
        if Type = Rec.Type::A then
            exit;
        // Recargar toda la línea desde BC cuando se detecta un cambio
        // Esto asegura que todos los meses se sincronicen correctamente

        // Obtener valor actual en la tabla temporal
        savedView := Rec.GetView();
        Rec.Reset();
        Rec.SetRange("Job No.", JobNo);
        Rec.SetRange(Concept, Concept);
        Rec.SetRange(Type, Type);
        Rec.SetRange(Year, YearFilter);

        if Rec.FindFirst() then begin
            // Obtener valor actual del mes en la tabla temporal
            case Month of
                1:
                    CurrentValue := Rec."JanImport";
                2:
                    CurrentValue := Rec."FebImport";
                3:
                    CurrentValue := Rec."MarImport";
                4:
                    CurrentValue := Rec."AprImport";
                5:
                    CurrentValue := Rec."MayImport";
                6:
                    CurrentValue := Rec."JunImport";
                7:
                    CurrentValue := Rec."JulImport";
                8:
                    CurrentValue := Rec."AugImport";
                9:
                    CurrentValue := Rec."SepImport";
                10:
                    CurrentValue := Rec."OctImport";
                11:
                    CurrentValue := Rec."NovImport";
                12:
                    CurrentValue := Rec."DecImport";
            end;

            // Obtener valor actual de BC para el mes específico
            BCValue := GetMonthValueFromBC(Month, JobNo, Concept, Type);

            // Si hay diferencias, recargar TODA la línea
            if BCValue <> CurrentValue then begin
                // Recargar todos los meses para esta línea específica
                Rec."JanImport" := GetMonthValueFromBC(01, JobNo, Concept, Type);
                Rec."FebImport" := GetMonthValueFromBC(02, JobNo, Concept, Type);
                Rec."MarImport" := GetMonthValueFromBC(03, JobNo, Concept, Type);
                Rec."AprImport" := GetMonthValueFromBC(04, JobNo, Concept, Type);
                Rec."MayImport" := GetMonthValueFromBC(05, JobNo, Concept, Type);
                Rec."JunImport" := GetMonthValueFromBC(06, JobNo, Concept, Type);
                Rec."JulImport" := GetMonthValueFromBC(07, JobNo, Concept, Type);
                Rec."AugImport" := GetMonthValueFromBC(08, JobNo, Concept, Type);
                Rec."SepImport" := GetMonthValueFromBC(09, JobNo, Concept, Type);
                Rec."OctImport" := GetMonthValueFromBC(10, JobNo, Concept, Type);
                Rec."NovImport" := GetMonthValueFromBC(11, JobNo, Concept, Type);
                Rec."DecImport" := GetMonthValueFromBC(12, JobNo, Concept, Type);

                Rec.Modify(false);
            end;
        end;

        Rec.SetView(savedView);
        CurrPage.Update(false);
    end;

    local procedure GetMonthValueFromBC(Month: Integer; JobNo: Code[20]; Concept: Option; Type: Option): Decimal
    var
        JobPlanningLine: Record "Job Planning Line";
        JobLedgerEntry: Record "Job Ledger Entry";
        ARBVRNJobUnitPlanning: Record ARBVRNJobUnitPlanning;
        FirstDay: Date;
        LastDay: Date;
        MonthValue: Decimal;
        LineCount: Integer;
    begin
        // Obtener valor de BC para un mes específico
        GetMonthDateRange(Month, YearFilter, FirstDay, LastDay);

        // Para números reales, usar JobLedgerEntry
        if Type = Rec.Type::R then begin
            JobLedgerEntry.SetRange("Job No.", JobNo);
            case Concept of
                Rec.Concept::Invoice:
                    begin
                        JobLedgerEntry.SetRange("Document Date", FirstDay, LastDay);
                        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Sale);
                    end;
                Rec.Concept::Labour:
                    begin
                        JobLedgerEntry.SetRange("ARBVRNTimesheetdate", FirstDay, LastDay);
                        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
                        JobLedgerEntry.SetRange(Type, JobLedgerEntry.Type::Resource);
                    end;
                Rec.Concept::Cost:
                    begin
                        JobLedgerEntry.SetRange("Posting Date", FirstDay, LastDay);
                        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
                        JobLedgerEntry.SetFilter(Type, '<>%1', JobLedgerEntry.Type::Resource);
                    end;
            end;

            if JobLedgerEntry.FindSet() then begin
                repeat
                    case Concept of
                        Rec.Concept::Invoice:
                            MonthValue += JobLedgerEntry."Line Amount (LCY)" * -1; // Negativo para ventas
                        Rec.Concept::Labour, Rec.Concept::Cost:
                            MonthValue += JobLedgerEntry."Total Cost (LCY)";
                    end;
                until JobLedgerEntry.Next() = 0;
                exit(MonthValue); // Devolver valor real
            end;
        end;

        // Para facturación planificada, verificar si hay expedientes primero
        if (Concept = Rec.Concept::Invoice) and (Type = Rec.Type::P) then begin
            ARBVRNJobUnitPlanning.SetRange(ARBVRNJobNo, JobNo);
            ARBVRNJobUnitPlanning.SetRange(ARBVRNPlanningDate, FirstDay, LastDay);
            ARBVRNJobUnitPlanning.SetRange(ARBVRNReal, FALSE);
            if ARBVRNJobUnitPlanning.FindSet() then begin
                repeat
                    if ARBVRNJobUnitPlanning.ARBVRNCertificationAmount <> 0 then
                        MonthValue += ARBVRNJobUnitPlanning.ARBVRNCertificationAmount;
                until ARBVRNJobUnitPlanning.Next() = 0;
                exit(MonthValue); // Si hay expedientes, devolver su valor
            end;
        end;

        JobPlanningLine.SetRange("Job No.", JobNo);
        JobPlanningLine.SetRange("Planning Date", FirstDay, LastDay);

        // Filtrar por tipo de línea según el concepto y tipo
        case Concept of
            Rec.Concept::Labour:
                // Para mano de obra (Labour)
                if Type = Rec.Type::P then begin
                    // Si es planificado (P), solo considerar Budget + Resource
                    JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Budget);
                    JobPlanningLine.SetRange(Type, JobPlanningLine.Type::Resource);
                end else begin
                    // Si es real (R), considerar Budget + Resource
                    JobPlanningLine.SetFilter("Line Type", '%1|%2',
                        JobPlanningLine."Line Type"::Budget,
                        JobPlanningLine."Line Type"::Billable);
                    JobPlanningLine.SetRange(Type, JobPlanningLine.Type::Resource);
                end;
            Rec.Concept::Cost:
                // Para costos (Cost)
                if Type = Rec.Type::P then begin
                    // Si es planificado (P), solo considerar Budget + NO Resource
                    JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Budget);
                    JobPlanningLine.SetFilter(Type, '<>%1', JobPlanningLine.Type::Resource);
                end else begin
                    // Si es real (R), considerar Budget + NO Resource
                    JobPlanningLine.SetFilter("Line Type", '%1|%2',
                        JobPlanningLine."Line Type"::Budget,
                        JobPlanningLine."Line Type"::Billable);
                    JobPlanningLine.SetFilter(Type, '<>%1', JobPlanningLine.Type::Resource);
                end;
            else
                // Para otros conceptos (Invoice, A), considerar Billable por defecto
                JobPlanningLine.SetRange("Line Type", JobPlanningLine."Line Type"::Billable);
        end;

        MonthValue := 0;
        LineCount := 0;
        if JobPlanningLine.FindSet() then begin
            repeat
                // Usar el campo correcto según el concepto
                case Concept of
                    Rec.Concept::Labour:
                        // Para mano de obra, usar Total Cost (LCY)
                        MonthValue += JobPlanningLine."Total Cost (LCY)";
                    Rec.Concept::Cost:
                        // Para costos/gastos, usar Total Cost (LCY)
                        MonthValue += JobPlanningLine."Total Cost (LCY)";
                    Rec.Concept::Invoice:
                        // Para facturación, usar Line Amount (LCY)
                        MonthValue += JobPlanningLine."Line Amount (LCY)";
                    else
                        // Para otros conceptos (A), usar Total Cost (LCY) por defecto
                        MonthValue += JobPlanningLine."Total Cost (LCY)";
                end;

                LineCount += 1;

            // Debug detallado de cada línea encontrada

            until JobPlanningLine.Next() = 0;
        end;



        exit(MonthValue);
    end;


}


