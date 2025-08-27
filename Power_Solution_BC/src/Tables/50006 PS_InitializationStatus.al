table 50006 PS_InitializationStatus
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "ID"; Integer)
        {
            DataClassification = SystemMetadata;
        }
        field(2; "IsInitialized"; Boolean)
        {
            DataClassification = SystemMetadata;
        }
        field(3; "SessionID"; Integer)
        {
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(PK; "ID") // Definir SessionID como clave primaria o parte de ella
        {
            Clustered = true;
        }
        key(SK; "SessionID") // Definir SessionID como clave primaria o parte de ella
        {
        }
    }
}
