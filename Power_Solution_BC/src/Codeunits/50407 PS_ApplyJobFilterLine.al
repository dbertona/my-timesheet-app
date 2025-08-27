codeunit 50407 "ApplyJobFilterLine"
{
    procedure ApplyFilter(var RecRef: RecordRef; FieldId: Integer; SearchFieldId1: Integer; SearchFieldId2: Integer; JobTypeFilter: Enum "PS_JobTypeEnum"; var AdditionalRecRef: RecordRef; AdditionalFieldId: Integer; AdditionalSearchFieldId1: Integer; AdditionalSearchFieldId2: Integer)
    var
        JobTeamRec: Record ARBVRNJobTeam;
        User: Record User;
        ResourceRec: Record Resource;
        JobRec: Record Job;
        UserEmail: Text[250];
        ResourceNo: Code[20];
        Filter: Text;
        HeaderFilter: Text;
        FilterCount: Integer;
        FirstJobNo: Code[20];
        FieldRef: FieldRef;
        JobTypeFilterText: Text[30];
        AdditionalFieldRef: FieldRef;
        DocNoFieldRef: FieldRef;
        JobNoFieldRef: FieldRef;
        UserDepartment: Text[30];
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserSetupRec: Record "User Setup";
        SearchFieldRef1: FieldRef;
        SearchFieldRef2: FieldRef;
        AdditionalSearchFieldRef1: FieldRef;
        AdditionalSearchFieldRef2: FieldRef;
    begin
        // Obtener el ID del usuario actual
        if not User.Get(UserSecurityID) then begin
            Message('No se encontró el ID de usuario.');
            exit;
        end;
        UserEmail := User."Authentication Email";

        // Obtener el departamento del usuario
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();

        // Leer la configuración del usuario
        if not UserSetupRec.Get(UserId()) then begin
            Message('No se encontró la configuración del usuario.');
            exit;
        end;

        // Convertir el filtro de Enum a Texto
        JobTypeFilterText := FORMAT(JobTypeFilter);

        // Establecer el rango para buscar el recurso utilizando el campo ARBVRNEMail
        ResourceRec.SetRange(ARBVRNEMail, UserEmail);
        if ResourceRec.FindFirst() then begin
            ResourceNo := ResourceRec."No.";
            JobTeamRec.SetRange(ARBVRNResourceNo, ResourceNo);
            Filter := '';
            HeaderFilter := '';
            FilterCount := 0;

            if JobTeamRec.FindSet() and UserSetupRec."Project team filter" then begin
                repeat
                    // Verificar si el proyecto existe en la tabla Job
                    if JobRec.Get(JobTeamRec.ARBVRNJobNo) then begin
                        // Filtrar los trabajos según el JobTypeFilter
                        if (JobTypeFilter = JobTypeFilter::Todos) or (FORMAT(JobRec.ARBVRNJobType) = JobTypeFilterText) then begin
                            // Filtrar también por el departamento del usuario si no está vacío
                            if (UserDepartment = '') or (JobRec."Global Dimension 1 Code" = UserDepartment) then begin
                                if FilterCount = 0 then
                                    FirstJobNo := JobTeamRec.ARBVRNJobNo;
                                if Filter = '' then
                                    Filter := JobTeamRec.ARBVRNJobNo
                                else
                                    Filter := Filter + '|' + JobTeamRec.ARBVRNJobNo;
                                FilterCount += 1;
                            end;
                        end;
                    end;
                until JobTeamRec.Next() = 0;

                // Verificar si se debe aplicar el filtro
                if (UserDepartment = '') and not UserSetupRec."Project team filter" then
                    exit;

                SearchFieldRef1 := RecRef.FIELD(SearchFieldId1);
                AdditionalSearchFieldRef1 := AdditionalRecRef.FIELD(AdditionalSearchFieldId1);

                // Verificar y aplicar filtros
                if FilterCount > 0 then begin
                    // Filtrar en la tabla Sales Invoice Header
                    SearchFieldRef1.SETFILTER(Filter);
                    if RecRef.FindSet() then begin
                        repeat
                            if HeaderFilter = '' then
                                HeaderFilter := FORMAT(RecRef.FIELD(FieldId))
                            else
                                HeaderFilter := HeaderFilter + '|' + FORMAT(RecRef.FIELD(FieldId));
                        until RecRef.Next() = 0;
                    end;

                    // Si no se encontraron cabeceras o si el campo ARBVRNJobNo está vacío, buscar en las líneas
                    if (HeaderFilter = '') or (FORMAT(RecRef.FIELD(FieldId).VALUE) = '') then begin
                        AdditionalSearchFieldRef1.SETFILTER(Filter);
                        if AdditionalRecRef.FindSet() then begin
                            repeat
                                if HeaderFilter = '' then
                                    HeaderFilter := Format(AdditionalRecRef.FIELD(AdditionalFieldId))
                                else
                                    HeaderFilter := HeaderFilter + '|' + Format(AdditionalRecRef.FIELD(AdditionalFieldId));
                            until AdditionalRecRef.Next() = 0;
                        end;
                    end;

                    // Aplicar el filtro combinado
                    FieldRef := RecRef.FIELD(FieldId);
                    FieldRef.SETFILTER(HeaderFilter);

                    // Aplicar el filtro en la referencia adicional si está inicializada
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETFILTER(HeaderFilter);
                    end;
                end else begin
                    FieldRef.SETRANGE(''); // Si no hay trabajos, filtrar para mostrar ninguno

                    // Limpiar filtro en la referencia adicional si está inicializada
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETRANGE('');
                    end;
                end;
            end else begin
                // Si UserDepartment no está vacío, buscar en SalesInvLineRec
                if UserDepartment <> '' then begin
                    AdditionalSearchFieldRef2 := AdditionalRecRef.FIELD(AdditionalSearchFieldId2);
                    AdditionalSearchFieldRef2.SETRANGE(UserDepartment);
                    HeaderFilter := '';
                    if AdditionalRecRef.FindSet() then begin
                        repeat
                            if HeaderFilter = '' then
                                HeaderFilter := FORMAT(AdditionalRecRef.FIELD(AdditionalFieldId))
                            else
                                HeaderFilter := HeaderFilter + '|' + FORMAT(AdditionalRecRef.FIELD(AdditionalFieldId));
                        until AdditionalRecRef.Next() = 0;
                    end;
                    // Aplicar el filtro a RecRef y AdditionalRecRef si está inicializada
                    FieldRef := RecRef.FIELD(FieldId);
                    FieldRef.SETFILTER(HeaderFilter);
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETFILTER(HeaderFilter);
                    end;
                end else if (UserDepartment = '') and not UserSetupRec."Project team filter" then begin
                    exit;
                end else begin
                    FieldRef := RecRef.FIELD(FieldId);
                    FieldRef.SETRANGE(''); // Si no hay trabajos, filtrar para mostrar ninguno

                    // Limpiar filtro en la referencia adicional si está inicializada
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETRANGE('');
                    end;
                end;
            end;
        end else begin
            Message('No se encontró el recurso con el correo %1.', UserEmail);
        end;
    end;
}
