"""Unit tests for Step 1 Data Dictionary Specification."""

import pytest
from src.models.data_dictionary import DATA_DICTIONARY, generate_markdown_data_dictionary


def test_data_dictionary_entities_coverage():
    """Verify that all required core entities are defined in DATA_DICTIONARY."""
    required_entities = [
        "Employee", "Team", "Skill", "ShiftTemplate", "ShiftAssignment",
        "LeaveRequest", "HolidayCalendar", "AttendanceEvent",
        "CoverageRequirement", "SwapRequest"
    ]
    for entity in required_entities:
        assert entity in DATA_DICTIONARY, f"Missing required entity: {entity}"


def test_data_dictionary_fields_metadata():
    """Verify that every field contains all required metadata attributes."""
    required_attributes = ["name", "type", "required", "allowed_values", "units", "uniqueness", "validation_rule"]

    for entity_name, meta in DATA_DICTIONARY.items():
        assert "description" in meta
        assert "cardinality" in meta
        assert "fields" in meta
        assert len(meta["fields"]) > 0

        for f in meta["fields"]:
            for attr in required_attributes:
                assert attr in f, f"Field '{f.get('name')}' in entity '{entity_name}' missing attribute '{attr}'"


def test_markdown_generator():
    """Verify that Markdown documentation generation works without error."""
    doc = generate_markdown_data_dictionary()
    assert "# Data Dictionary" in doc
    assert "## Entity: `Employee`" in doc
    assert "## Entity: `ShiftAssignment`" in doc
