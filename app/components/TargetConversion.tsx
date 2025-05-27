import { useState } from "react";
import { useAvailableConversions } from "~/utils/registry/useAvailableConversions";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConversionButtonList } from "~/components/ConversionButtonList";

interface TargetConversionProps {
  sourceData: any; // your parsed source preset data
  originalFileName: string | null;
  sourceFormatId: string; // e.g. "AbletonEq8"
  title?: string;
}

export function TargetConversion({
  sourceData,
  originalFileName,
  sourceFormatId,
  title,
}: TargetConversionProps) {
  const { t } = useTranslation();
  const conversions = useAvailableConversions(sourceFormatId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sourceData) {
    return <p>{t("conversion.noSourcePreset")}</p>;
  }

  return title ? (
    <Card className="mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ConversionButtonList
          conversions={conversions}
          sourceData={sourceData}
          originalFileName={originalFileName}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          error={error}
          setError={setError}
        />
      </CardContent>
    </Card>
  ) : (
    <ConversionButtonList
      conversions={conversions}
      sourceData={sourceData}
      originalFileName={originalFileName}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      error={error}
      setError={setError}
    />
  );
}
