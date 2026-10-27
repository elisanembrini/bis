const formatter = new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "Europe/Rome" });

export const formatDate = (isoDate: string): string => formatter.format(new Date(isoDate));
