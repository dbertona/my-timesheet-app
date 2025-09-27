// Extensión de la Tabla Customers
tableextension 51005 "Ps User Setup" extends "User Setup"
{
    fields
    {
        field(50100; "Project team filter"; Boolean)
        {
            Caption = 'Project team filter';
            DataClassification = ToBeClassified;
        }
    }

    trigger OnInsert()
    begin
        Rec."Project team filter" := true;
    end;

    trigger OnBeforeModify()
    var
        RecRef: RecordRef;
    begin
        RecRef.GetTable(Rec);

        // Validate Project team filter
        if ("Project team filter" and ("ARBVRNJobresponsabilityfilter" <> '')) then
            Error(ErrorMessageProjectTeam);

        // Validate ARBVRNJobresponsabilityfilter
        if (("ARBVRNJobresponsabilityfilter" <> '') and ("Project team filter")) then
            Error(ErrorMessageJobResponsibility);
    end;

    var
        ErrorMessageProjectTeam: Label 'You cannot have a value in "Project Responsibility Filter" when "Project team filter" is checked.', Locked = true;
        ErrorMessageJobResponsibility: Label 'You must uncheck "Filter by project team" if "Project Responsibility Filter" has a value.', Locked = true;
}
