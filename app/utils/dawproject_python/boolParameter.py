from classes.parameter import Parameter


class BoolParameter(Parameter):
    def __init__(
        self, value=None, parameter_id=None, name=None, color=None, comment=None
    ):
        super().__init__(parameter_id, name, color, comment)
        self.value = value

    def to_xml(self):
        bool_param_elem = super().to_xml()  # Inherits the XML creation from Parameter
        bool_param_elem.tag = "BoolParameter"
        if self.value is not None:
            # Ensure that value is set as a string 'true' or 'false'
            bool_param_elem.set("value", str(self.value).lower())
        return bool_param_elem

    @classmethod
    def from_xml(cls, element):
        instance = super().from_xml(element)
        value = element.get("value")
        instance.value = value.lower() == "true" if value else None
        return instance
