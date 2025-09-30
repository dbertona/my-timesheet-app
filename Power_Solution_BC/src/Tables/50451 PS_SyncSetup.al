table 50451 "PS_SyncSetup"
{
    DataClassification = SystemMetadata;

    fields
    {
        field(1; "Primary Key"; Integer)
        {
            AutoIncrement = true;
            DataClassification = SystemMetadata;
        }
        field(2; "Webhook URL"; Text[250])
        {
            DataClassification = SystemMetadata;
        }
        field(3; "API Key"; Text[250])
        {
            DataClassification = SystemMetadata;
        }
        field(4; "Debounce Seconds"; Integer)
        {
            DataClassification = SystemMetadata;
        }
        field(5; "Supabase REST URL"; Text[250])
        {
            DataClassification = SystemMetadata;
        }
        field(6; "Supabase API Key"; Text[250])
        {
            DataClassification = SystemMetadata;
        }
    }

    keys
    {
        key(PK; "Primary Key")
        {
            Clustered = true;
        }
    }
}








