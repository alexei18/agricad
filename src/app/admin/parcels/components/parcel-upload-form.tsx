
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { uploadParcelsAction } from '../actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert for error details

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

// Define a Zod schema for the file input itself (client-side validation)
const FileSchema = z.custom<File>((val): val is File => val instanceof File, {
  message: 'Vă rugăm să selectați un fișier',
})
.refine(file => file?.size <= MAX_FILE_SIZE, `Dimensiunea maximă a fișierului este 5MB.`)
.refine(
    file => ACCEPTED_FILE_TYPES.some(type => file?.type.startsWith(type) || file?.type === '' || file?.type === 'text/plain'), // Allow empty type or plain text
    "Sunt acceptate doar fișiere .csv."
);

// Define the form schema using the file schema
const formSchema = z.object({
  parcelFile: FileSchema
});


type FormData = z.infer<typeof formSchema>;

export function ParcelUploadForm() {
  // Hardcoded Romanian strings
  const formLabel = "Fișier Date Parcele (.csv)";
  // Updated description to match action expectation
  const formDescription = 'Încărcați un CSV cu coloanele: parcel_id (text), area_hectares (număr), projected_polygon (text "POLYGON((X Y,...))" în proiecție locală), village (text). Max 5MB.';
  const uploadButton = "Încarcă/Actualizează Parcele";
  const uploadingButton = "Se încarcă...";
  const successTitle = "Succes";
  const validationErrorTitle = "Eroare de Validare";
  const uploadErrorTitle = "Eroare la Încărcarea Parcelelor";
  const validationErrorDesc = "Verificați erorile detaliate mai jos.";
  const unknownErrorDesc = "A apărut o eroare necunoscută.";
  const uploadFailedTitle = "Încărcare Eșuată";
  const clientErrorDesc = "A apărut o eroare neașteptată pe client.";
  const validationDetailsTitle = "Detalii Eroare Validare";

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadErrorDetails, setUploadErrorDetails] = React.useState<string[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parcelFile: undefined,
    },
    mode: 'onChange',
  });


  async function onSubmit(data: FormData) {
     setUploadErrorDetails(null);

     if (!(data.parcelFile instanceof File)) {
        form.setError("parcelFile", { type: "manual", message: "Obiect de fișier invalid. Vă rugăm să selectați din nou un fișier." });
        console.error("Form submitted without a valid File object:", data.parcelFile);
        return;
     }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('parcelFile', data.parcelFile);

    try {
      const result = await uploadParcelsAction(formData);

      if (result.success) {
        toast({
          title: successTitle,
          description: `${result.message} (${result.processedCount ?? 0} parcele procesate/actualizate).`,
        });
        form.reset({ parcelFile: undefined });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      } else {
        if (result.errorDetails && result.errorDetails.length > 0) {
             setUploadErrorDetails(result.errorDetails);
             toast({
                title: validationErrorTitle,
                description: result.message || validationErrorDesc,
                variant: 'destructive',
                duration: 10000,
             });
        } else {
            toast({
              title: uploadErrorTitle,
              description: result.message || unknownErrorDesc,
              variant: 'destructive',
            });
        }
      }
    } catch (error) {
      console.error('Upload submission error:', error);
      toast({
        title: uploadFailedTitle,
        description: error instanceof Error ? error.message : clientErrorDesc,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="parcelFile"
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <FormItem>
              <FormLabel htmlFor={name}>{formLabel}</FormLabel>
              <FormControl>
                <Input
                    id={name}
                    type="file"
                    accept=".csv, text/csv, application/vnd.ms-excel, text/plain"
                    onBlur={onBlur}
                    name={name}
                    onChange={(e) => {
                        onChange(e.target.files?.[0] ?? undefined);
                        setUploadErrorDetails(null);
                    }}
                    ref={(instance) => {
                      ref(instance);
                      fileInputRef.current = instance;
                    }}
                    className="file:text-primary file:font-medium"
                 />
              </FormControl>
              <FormDescription>
                 {formDescription} {/* Description updated */}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {uploadErrorDetails && (
            <Alert variant="destructive" className="max-h-60 overflow-y-auto">
                <AlertTitle>{validationDetailsTitle}</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                        {uploadErrorDetails.map((detail, index) => (
                            <li key={index}>{detail}</li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>
        )}


        <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? uploadingButton : uploadButton}
        </Button>
      </form>
    </Form>
  );
}
