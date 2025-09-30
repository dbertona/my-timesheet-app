table 50450 "PS_SyncQueue"
{
    DataClassification = SystemMetadata;

    fields
    {
        field(1; "ID"; Integer)
        {
            AutoIncrement = true;
            DataClassification = SystemMetadata;
        }
        field(2; "Company Name"; Text[100])
        {
            DataClassification = SystemMetadata;
        }
        field(3; "Entity"; Text[50])
        {
            DataClassification = SystemMetadata;
        }
        field(4; "Event Type"; Option)
        {
            OptionMembers = Insert,Modify,Delete;
            DataClassification = SystemMetadata;
        }
        field(5; "Status"; Option)
        {
            OptionMembers = Pending,Processing,Done,Error;
            DataClassification = SystemMetadata;
        }
        field(6; "Attempts"; Integer)
        {
            DataClassification = SystemMetadata;
        }
        field(7; "Payload"; Text[2048])
        {
            DataClassification = SystemMetadata;
        }
        field(8; "Created At"; DateTime)
        {
            DataClassification = SystemMetadata;
        }
        field(9; "Processed At"; DateTime)
        {
            DataClassification = SystemMetadata;
        }
        field(10; "Http Status Code"; Integer)
        {
            DataClassification = SystemMetadata;
        }
        field(11; "Last Response"; Text[2048])
        {
            DataClassification = SystemMetadata;
        }
        field(12; "Last Error"; Text[2048])
        {
            DataClassification = SystemMetadata;
        }
    }

    keys
    {
        key(PK; "ID")
        {
            Clustered = true;
        }
        key(K2; "Company Name", "Entity", "Status")
        {
        }
    }
}






