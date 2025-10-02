package sep490g65.fvcapi.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class FormStatusConverter implements AttributeConverter<FormStatus, String> {
    @Override
    public String convertToDatabaseColumn(FormStatus attribute) {
        if (attribute == null) return null;
        switch (attribute) {
            case DRAFT: return "DRAFT";
            case PUBLISH: return "PUBLISH";
            case ARCHIVED: return "ARCHIVED";
            case POSTPONE: return "POSTPONE";
            default: return attribute.name();
        }
    }

    @Override
    public FormStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        switch (dbData) {
            case "DRAFT": return FormStatus.DRAFT;
            case "PUBLISH": return FormStatus.PUBLISH;
            case "ARCHIVED": return FormStatus.ARCHIVED;
            case "POSTPONE": return FormStatus.POSTPONE;
            // Backward compatibility with old values
            case "PUBLISHED": return FormStatus.PUBLISH;
            case "CLOSED": return FormStatus.ARCHIVED;
            case "POSTPONED": return FormStatus.POSTPONE;
            default:
                try {
                    return FormStatus.valueOf(dbData);
                } catch (IllegalArgumentException ex) {
                    return FormStatus.DRAFT;
                }
        }
    }
}


