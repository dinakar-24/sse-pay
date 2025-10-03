import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId,
      assignmentId 
    } = await req.json();

    console.log('Verifying payment:', razorpay_payment_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      throw new Error('Invalid payment signature');
    }

    console.log('Payment signature verified successfully');

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'completed'
      })
      .eq('id', paymentId);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      throw paymentError;
    }

    // Update assignment as paid
    const { error: assignmentError } = await supabase
      .from('student_assignments')
      .update({ paid: true })
      .eq('id', assignmentId);

    if (assignmentError) {
      console.error('Error updating assignment:', assignmentError);
      throw assignmentError;
    }

    console.log('Payment verified and records updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
