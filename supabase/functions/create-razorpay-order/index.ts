import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assignmentId, studentId } = await req.json();

    console.log('Creating Razorpay order for assignment:', assignmentId, 'student:', studentId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('student_assignments')
      .select(`
        *,
        events(title, type),
        students(name, email)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.paid) {
      throw new Error('Assignment already paid');
    }

    // Create Razorpay order
    // Receipt must be max 40 characters, so we use timestamp + truncated ID
    const receiptId = `${Date.now()}-${assignmentId.substring(0, 8)}`;
    
    const orderData = {
      amount: Math.round(assignment.amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        assignment_id: assignmentId,
        student_id: studentId,
        event_type: assignment.events?.type || 'general',
        event_title: assignment.events?.title || 'Payment'
      }
    };

    const authHeader = 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(orderData)
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();

    console.log('Razorpay order created:', razorpayOrder.id);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        event_id: assignment.event_id,
        assignment_id: assignmentId,
        amount: assignment.amount,
        razorpay_order_id: razorpayOrder.id,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw paymentError;
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        amount: assignment.amount,
        currency: 'INR',
        keyId: razorpayKeyId,
        paymentId: payment.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-razorpay-order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
