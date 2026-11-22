package fi.guildgame.app;
/** CTC collapse only. No expected answer, vocabulary forcing or fuzzy acceptance. */
final class CtcDecoder {
 static String decode(float[][] logits,String[] tokens,int blank){
  StringBuilder text=new StringBuilder();int previous=-1;
  for(float[] frame:logits){
   int best=0;for(int i=1;i<frame.length;i++)if(frame[i]>frame[best])best=i;
   if(best!=previous && best!=blank && best<tokens.length){
    String token=tokens[best];
    if(!token.startsWith("<") && !token.startsWith("["))text.append(token.equals("|")?" ":token);
   }
   previous=best;
  }
  return text.toString().replaceAll("\\s+"," ").trim();
 }
 static float[] normalise(float[] audio){
  double mean=0,variance=0;for(float value:audio)mean+=value;mean/=Math.max(1,audio.length);
  for(float value:audio){double x=value-mean;variance+=x*x;}variance/=Math.max(1,audio.length);
  double scale=1/Math.sqrt(variance+1e-7);float[] result=new float[audio.length];
  for(int i=0;i<audio.length;i++)result[i]=(float)((audio[i]-mean)*scale);
  return result;
 }
}
